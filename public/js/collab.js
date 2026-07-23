// Collaboration module: Yjs + WebRTC for real-time multi-user sessions
// Uses CDN ESM imports via import map defined in discovery.html

import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { state, save, setOnSaveHook } from './state.js';
import { uid } from './utils.js';

// ============ Room / session management ============
const ROOM_PREFIX = 'discovery-canvas-';
const SIGNALING_SERVERS = [
  'wss://signaling.yjs.dev',
  'wss://y-webrtc-signaling-eu.herokuapp.com',
  'wss://y-webrtc-signaling-us.herokuapp.com',
];

// User colors for presence
const PRESENCE_COLORS = [
  '#0a84ff', '#ff2d55', '#34c759', '#ff9500', '#af52de',
  '#5ac8fa', '#ffcc00', '#ff3b30', '#5856d6', '#30b0c7',
  '#ff6482', '#63da38', '#ff9f0a', '#bf5af2', '#64d2ff',
];

let ydoc = null;
let provider = null;
let awareness = null;
let roomCode = null;
let localNickname = '';
let localColor = '';
let syncing = false; // prevents feedback loops

// ============ Generate / validate room codes ============
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function isValidRoomCode(code) {
  return /^[A-Z2-9]{6}$/.test((code || '').toUpperCase().trim());
}

// ============ Get connected peers ============
export function getPeers() {
  if (!awareness) return [];
  const states = awareness.getStates();
  const peers = [];
  states.forEach((state, clientId) => {
    if (state.user) {
      peers.push({
        clientId,
        nickname: state.user.nickname || 'Anonymous',
        color: state.user.color || '#888',
        isLocal: clientId === ydoc.clientID,
      });
    }
  });
  return peers;
}

export function getRoomCode() { return roomCode; }
export function isConnected() { return !!provider; }
export function getNickname() { return localNickname; }

// ============ Awareness change callbacks ============
let onPeersChange = null;
export function setOnPeersChange(fn) { onPeersChange = fn; }

let onConnectionStatusChange = null;
export function setOnConnectionStatusChange(fn) { onConnectionStatusChange = fn; }

// ============ Create / Join a room ============
export function createRoom(nickname) {
  const code = generateRoomCode();
  return joinRoom(code, nickname);
}

export function joinRoom(code, nickname) {
  if (provider) disconnect();

  code = code.toUpperCase().trim();
  if (!isValidRoomCode(code)) {
    throw new Error('Invalid room code. Must be 6 characters (letters + digits).');
  }

  roomCode = code;
  localNickname = nickname || 'Anonymous';
  localColor = PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)];

  // Create Yjs document
  ydoc = new Y.Doc();

  // Shared types matching our state structure
  const yCards = ydoc.getArray('cards');
  const yConnections = ydoc.getArray('connections');
  const yLanes = ydoc.getArray('lanes');
  const yPrompts = ydoc.getArray('prompts');
  const yMeta = ydoc.getMap('meta'); // canvasType, session info, etc.

  // Create WebRTC provider
  provider = new WebrtcProvider(ROOM_PREFIX + code, ydoc, {
    signaling: SIGNALING_SERVERS,
    password: null, // could add encryption later
    maxConns: 20,
  });

  awareness = provider.awareness;

  // Set local user state
  awareness.setLocalStateField('user', {
    nickname: localNickname,
    color: localColor,
    joinedAt: Date.now(),
  });

  // Listen for awareness changes (peers joining/leaving)
  awareness.on('change', () => {
    if (onPeersChange) onPeersChange(getPeers());
  });

  // Listen for connection status
  provider.on('status', (event) => {
    if (onConnectionStatusChange) onConnectionStatusChange(event.connected);
  });

  // Sync initial state if we're the first peer (room is empty)
  // Wait a moment to see if we receive state from existing peers
  setTimeout(() => {
    if (yCards.length === 0 && state.cards.length > 0) {
      // We're likely the first peer — push our local state
      pushStateToYjs();
    } else if (yCards.length > 0) {
      // Room has existing state — pull it
      pullStateFromYjs();
    }
  }, 1000);

  // Observe remote changes
  yCards.observe(() => { if (!syncing) pullStateFromYjs(); });
  yConnections.observe(() => { if (!syncing) pullStateFromYjs(); });
  yLanes.observe(() => { if (!syncing) pullStateFromYjs(); });
  yPrompts.observe(() => { if (!syncing) pullStateFromYjs(); });
  yMeta.observe(() => { if (!syncing) pullMetaFromYjs(); });

  // Save room info to localStorage for reconnect
  localStorage.setItem('collab-room', JSON.stringify({ code, nickname: localNickname }));

  // Register save hook to sync local changes to Yjs
  setOnSaveHook(() => syncLocalChange());

  return code;
}

// ============ Disconnect ============
export function disconnect() {
  if (provider) {
    provider.disconnect();
    provider.destroy();
    provider = null;
  }
  if (ydoc) {
    ydoc.destroy();
    ydoc = null;
  }
  awareness = null;
  roomCode = null;
  localStorage.removeItem('collab-room');
  setOnSaveHook(null);
  if (onPeersChange) onPeersChange([]);
  if (onConnectionStatusChange) onConnectionStatusChange(false);
}

// ============ Push local state → Yjs ============
export function pushStateToYjs() {
  if (!ydoc) return;
  syncing = true;

  const yCards = ydoc.getArray('cards');
  const yConnections = ydoc.getArray('connections');
  const yLanes = ydoc.getArray('lanes');
  const yPrompts = ydoc.getArray('prompts');
  const yMeta = ydoc.getMap('meta');

  ydoc.transact(() => {
    // Replace arrays
    yCards.delete(0, yCards.length);
    yCards.push(state.cards.map(c => ({ ...c })));

    yConnections.delete(0, yConnections.length);
    yConnections.push(state.connections.map(c => ({ ...c })));

    yLanes.delete(0, yLanes.length);
    yLanes.push(state.lanes.map(l => ({ ...l })));

    yPrompts.delete(0, yPrompts.length);
    yPrompts.push(state.prompts.map(p => ({ ...p })));

    // Meta
    yMeta.set('canvasType', state.canvasType);
    if (state.session) {
      yMeta.set('session', JSON.parse(JSON.stringify(state.session)));
    }
  });

  syncing = false;
}

// ============ Pull Yjs → local state ============
function pullStateFromYjs() {
  if (!ydoc) return;
  syncing = true;

  const yCards = ydoc.getArray('cards');
  const yConnections = ydoc.getArray('connections');
  const yLanes = ydoc.getArray('lanes');
  const yPrompts = ydoc.getArray('prompts');

  state.cards = yCards.toArray().map(c => ({ ...c }));
  state.connections = yConnections.toArray().map(c => ({ ...c }));
  state.lanes = yLanes.toArray().map(l => ({ ...l }));
  state.prompts = yPrompts.toArray().map(p => ({ ...p }));

  // Re-render
  if (window.__renderAll) window.__renderAll();
  save();

  syncing = false;
}

function pullMetaFromYjs() {
  if (!ydoc) return;
  syncing = true;

  const yMeta = ydoc.getMap('meta');
  const ct = yMeta.get('canvasType');
  if (ct && ct !== state.canvasType) {
    state.canvasType = ct;
    const sel = document.getElementById('canvasType');
    if (sel) sel.value = ct;
  }
  const sess = yMeta.get('session');
  if (sess) state.session = JSON.parse(JSON.stringify(sess));

  if (window.__renderAll) window.__renderAll();
  save();

  syncing = false;
}

// ============ Notify Yjs of local changes ============
// Call this after any local mutation (instead of just save())
export function syncLocalChange() {
  if (!ydoc || syncing) return;
  pushStateToYjs();
}

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
