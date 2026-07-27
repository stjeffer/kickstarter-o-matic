// Collaboration module: WebSocket relay for real-time multi-user sessions
// No third-party data storage — all data flows through our relay server
// and is held in-memory only. When all peers leave, the room is deleted.

import { state, save, setOnSaveHook } from './state.js';
import { STORAGE_KEY } from './constants.js';

// ============ Server URL ============
// In production, set this to your deployed relay server URL
const RELAY_URL = (() => {
  const loc = window.location;
  // Check for an explicit override (set via query param or global)
  if (window.__RELAY_URL) return window.__RELAY_URL;
  // Default: use localhost in dev, deployed server in production
  if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
    return 'ws://localhost:8787';
  }
  // Production — update this when you deploy the relay server
  return 'wss://discovery-canvas-relay.fly.dev';
})();

// User colors for presence
const PRESENCE_COLORS = [
  '#0a84ff', '#ff2d55', '#34c759', '#ff9500', '#af52de',
  '#5ac8fa', '#ffcc00', '#ff3b30', '#5856d6', '#30b0c7',
  '#ff6482', '#63da38', '#ff9f0a', '#bf5af2', '#64d2ff',
];

let ws = null;
let roomCode = null;
let localNickname = '';
let localColor = '';
let syncing = false; // prevents feedback loops
let pushTimer = null; // throttle pushes
let peers = []; // current peer list from server
let reconnectTimer = null;

// ============ Generate / validate room codes ============
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function isValidRoomCode(code) {
  return /^[A-Z2-9]{6}$/.test((code || '').toUpperCase().trim());
}

// ============ Get connected peers ============
export function getPeers() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return [];
  // Add isLocal flag to each peer
  return peers.map(p => ({ ...p }));
}

export function getRoomCode() { return roomCode; }
export function isConnected() { return !!(ws && ws.readyState === WebSocket.OPEN && roomCode); }
export function getNickname() { return localNickname; }

// ============ Callbacks ============
let onPeersChange = null;
export function setOnPeersChange(fn) { onPeersChange = fn; }

let onConnectionStatusChange = null;
export function setOnConnectionStatusChange(fn) { onConnectionStatusChange = fn; }

// ============ WebSocket message handler ============
function handleMessage(event) {
  let msg;
  try { msg = JSON.parse(event.data); } catch { return; }

  switch (msg.type) {
    case 'room-created':
      console.log('[collab] Room created:', msg.room);
      break;

    case 'joined':
      console.log('[collab] Joined room:', msg.room);
      // If server has cached state, pull it
      if (msg.state) {
        applyRemoteState(msg.state);
      } else if (state.cards.length > 0) {
        // First peer — push our local state
        console.log('[collab] First peer — pushing local state');
        pushStateToServer();
      }
      break;

    case 'presence':
      peers = (msg.peers || []).map(p => ({
        clientId: p.clientId,
        nickname: p.nickname || 'Anonymous',
        color: p.color || '#888',
        isLocal: p.nickname === localNickname && p.color === localColor,
      }));
      console.log('[collab] Presence update, peers:', peers.length);
      if (onPeersChange) onPeersChange(peers);
      break;

    case 'state-update':
      if (!syncing && !pushTimer) {
        console.log('[collab] Remote state update from peer', msg.from);
        applyRemoteState(msg.state);
      }
      break;
  }
}

// ============ Apply remote state to local ============
function applyRemoteState(remoteState) {
  if (!remoteState) return;
  syncing = true;

  try {
    if (remoteState.cards) state.cards = remoteState.cards.filter(c => c && c.id && c.x !== undefined);
    if (remoteState.connections) state.connections = remoteState.connections.filter(c => c && c.id && c.from && c.to);
    if (remoteState.lanes) state.lanes = remoteState.lanes.filter(l => l && l.id);
    if (remoteState.prompts) state.prompts = remoteState.prompts.filter(p => p && p.id);

    if (remoteState.canvasType && remoteState.canvasType !== state.canvasType) {
      state.canvasType = remoteState.canvasType;
      const sel = document.getElementById('canvasType');
      if (sel) sel.value = remoteState.canvasType;
    }
    if (remoteState.session) state.session = remoteState.session;

    console.log('[collab] Applied remote state — cards:', state.cards.length);

    if (window.__renderAll) window.__renderAll();

    // Save to localStorage WITHOUT triggering the sync hook
    try {
      const { selection, view, ...persist } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
    } catch { /* silent */ }
  } catch (e) {
    console.error('[collab] Failed to apply remote state:', e);
  }

  syncing = false;
}

// ============ Create / Join a room ============
export function createRoom(nickname) {
  const code = generateRoomCode();
  return joinRoom(code, nickname);
}

export function joinRoom(code, nickname) {
  if (ws) disconnect();

  code = code.toUpperCase().trim();
  if (!isValidRoomCode(code)) {
    throw new Error('Invalid room code. Must be 6 characters (letters + digits).');
  }

  roomCode = code;
  localNickname = nickname || 'Anonymous';
  localColor = PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)];

  console.log('[collab] Connecting to relay:', RELAY_URL);

  try {
    ws = new WebSocket(RELAY_URL);
  } catch (e) {
    console.error('[collab] Failed to create WebSocket:', e);
    throw new Error('Failed to connect to relay server.');
  }

  ws.onopen = () => {
    console.log('[collab] Connected to relay server');
    // Send join message
    ws.send(JSON.stringify({
      type: 'join',
      room: code,
      nickname: localNickname,
      color: localColor,
    }));

    if (onConnectionStatusChange) onConnectionStatusChange(true);
  };

  ws.onmessage = handleMessage;

  ws.onclose = () => {
    console.log('[collab] WebSocket closed');
    if (onConnectionStatusChange) onConnectionStatusChange(false);
    // Auto-reconnect if we still have a room code
    if (roomCode) {
      console.log('[collab] Scheduling reconnect...');
      reconnectTimer = setTimeout(() => {
        if (roomCode) {
          console.log('[collab] Reconnecting...');
          try {
            const savedCode = roomCode;
            const savedNick = localNickname;
            roomCode = null; // prevent disconnect() from clearing
            ws = null;
            joinRoom(savedCode, savedNick);
          } catch (e) {
            console.error('[collab] Reconnect failed:', e);
          }
        }
      }, 2000);
    }
  };

  ws.onerror = (e) => {
    console.error('[collab] WebSocket error:', e);
  };

  // Notify UI
  if (onPeersChange) onPeersChange(getPeers());

  // Save room info to localStorage for reconnect
  localStorage.setItem('collab-room', JSON.stringify({ code, nickname: localNickname }));

  // Register save hook to sync local changes
  setOnSaveHook(() => syncLocalChange());

  return code;
}

// ============ Disconnect ============
export function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  if (ws) {
    ws.onclose = null; // prevent auto-reconnect
    ws.close();
    ws = null;
  }
  roomCode = null;
  peers = [];
  localStorage.removeItem('collab-room');
  setOnSaveHook(null);
  if (onPeersChange) onPeersChange([]);
  if (onConnectionStatusChange) onConnectionStatusChange(false);
}

// ============ End session (just disconnect — nothing to delete!) ============
export async function deleteRoomAndDisconnect() {
  // With WebSocket relay, there's no persistent data to delete.
  // Just disconnect — the server drops the room when all peers leave.
  disconnect();
}

// ============ Push local state → server ============
function doPush() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  syncing = true;

  try {
    const payload = {
      cards: state.cards,
      connections: state.connections,
      lanes: state.lanes,
      prompts: state.prompts,
      canvasType: state.canvasType,
      session: state.session,
    };

    ws.send(JSON.stringify({
      type: 'state-update',
      state: payload,
    }));

    console.log('[collab] Pushed state — cards:', state.cards.length);
  } catch (e) {
    console.error('[collab] Push failed:', e);
  }

  syncing = false;
}

// Throttled push: coalesce rapid save() calls
export function pushStateToStorage() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    doPush();
  }, 300);
}

// Alias for compatibility
function pushStateToServer() {
  pushStateToStorage();
}

// ============ Sync local changes ============
export function syncLocalChange() {
  if (!ws || ws.readyState !== WebSocket.OPEN || syncing) return;
  pushStateToStorage();
}

// Keep same export name for collab-ui.js compatibility
export { pushStateToStorage as pushStateToYjs };

// ============ Auto-reconnect on page load ============
export function tryAutoReconnect() {
  const saved = localStorage.getItem('collab-room');
  if (!saved) return false;
  try {
    const { code, nickname } = JSON.parse(saved);
    if (code && nickname) {
      joinRoom(code, nickname);
      return true;
    }
  } catch (e) { /* ignore */ }
  return false;
}
