// Collaboration module: Yjs + Liveblocks for real-time multi-user sessions
// Uses CDN ESM imports via import map defined in discovery.html

import * as Y from 'yjs';
import { createClient } from '@liveblocks/client';
import { getYjsProviderForRoom } from '@liveblocks/yjs';
import { state, save, setOnSaveHook } from './state.js';

// ============ Liveblocks client ============
const LIVEBLOCKS_PUBLIC_KEY = 'pk_prod_fL8J_IAVOGHuBBReNmSTJt_aNbAAzXIBcOpYm9FufRJYvd5bgs74u1R1Mvpo6IyR';
const ROOM_PREFIX = 'discovery-canvas-';

const lbClient = createClient({
  publicApiKey: LIVEBLOCKS_PUBLIC_KEY,
});

// User colors for presence
const PRESENCE_COLORS = [
  '#0a84ff', '#ff2d55', '#34c759', '#ff9500', '#af52de',
  '#5ac8fa', '#ffcc00', '#ff3b30', '#5856d6', '#30b0c7',
  '#ff6482', '#63da38', '#ff9f0a', '#bf5af2', '#64d2ff',
];

let ydoc = null;
let yProvider = null;
let awareness = null;
let room = null;
let currentRoomId = null;
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
  states.forEach((peerState, clientId) => {
    if (peerState.user) {
      peers.push({
        clientId,
        nickname: peerState.user.nickname || 'Anonymous',
        color: peerState.user.color || '#888',
        isLocal: clientId === ydoc.clientID,
      });
    }
  });
  return peers;
}

export function getRoomCode() { return roomCode; }
export function isConnected() { return !!yProvider; }
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
  if (yProvider) disconnect();

  code = code.toUpperCase().trim();
  if (!isValidRoomCode(code)) {
    throw new Error('Invalid room code. Must be 6 characters (letters + digits).');
  }

  roomCode = code;
  localNickname = nickname || 'Anonymous';
  localColor = PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)];

  // Enter Liveblocks room
  const roomId = ROOM_PREFIX + code;
  currentRoomId = roomId;
  console.log('[collab] Entering Liveblocks room:', roomId);

  try {
    room = lbClient.enterRoom(roomId, {
      initialPresence: {
        nickname: localNickname,
        color: localColor,
        joinedAt: Date.now(),
      },
    });
  } catch (e) {
    console.error('[collab] Failed to enter room:', e);
    throw new Error('Failed to connect. Check browser console for details.');
  }

  // Get Yjs provider from the room
  yProvider = getYjsProviderForRoom(room);
  ydoc = yProvider.getYDoc();
  awareness = yProvider.awareness;
  console.log('[collab] Liveblocks Yjs provider ready, clientID:', ydoc.clientID);

  // Shared types matching our state structure
  const yCards = ydoc.getArray('cards');
  const yConnections = ydoc.getArray('connections');
  const yLanes = ydoc.getArray('lanes');
  const yPrompts = ydoc.getArray('prompts');
  const yMeta = ydoc.getMap('meta');

  // Set local awareness/presence state
  awareness.setLocalStateField('user', {
    nickname: localNickname,
    color: localColor,
    joinedAt: Date.now(),
  });

  // Listen for awareness changes (peers joining/leaving)
  awareness.on('update', () => {
    const peers = getPeers();
    console.log('[collab] Awareness update, peers:', peers.length, peers.map(p => p.nickname));
    if (onPeersChange) onPeersChange(peers);
  });

  // Notify connected
  if (onConnectionStatusChange) onConnectionStatusChange(true);

  // Listen for room connection status changes
  room.subscribe('status', (status) => {
    const connected = status === 'connected';
    console.log('[collab] Room status:', status);
    if (onConnectionStatusChange) onConnectionStatusChange(connected);
  });

  // Sync initial state: wait briefly to see if room has existing data
  setTimeout(() => {
    console.log('[collab] Initial sync check — yCards:', yCards.length, 'localCards:', state.cards.length);
    if (yCards.length === 0 && state.cards.length > 0) {
      console.log('[collab] Pushing local state to Yjs (first peer)');
      pushStateToYjs();
    } else if (yCards.length > 0) {
      console.log('[collab] Pulling existing state from Yjs');
      pullStateFromYjs();
    }
  }, 1500);

  // Observe remote changes
  yCards.observe(() => { if (!syncing) { console.log('[collab] Remote cards change detected'); pullStateFromYjs(); } });
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
  if (currentRoomId) {
    lbClient.leaveRoom(currentRoomId);
    currentRoomId = null;
  }
  room = null;
  yProvider = null;
  ydoc = null;
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
  console.log('[collab] Pushing state to Yjs — cards:', state.cards.length, 'connections:', state.connections.length);

  const yCards = ydoc.getArray('cards');
  const yConnections = ydoc.getArray('connections');
  const yLanes = ydoc.getArray('lanes');
  const yPrompts = ydoc.getArray('prompts');
  const yMeta = ydoc.getMap('meta');

  ydoc.transact(() => {
    yCards.delete(0, yCards.length);
    yCards.push(state.cards.map(c => ({ ...c })));

    yConnections.delete(0, yConnections.length);
    yConnections.push(state.connections.map(c => ({ ...c })));

    yLanes.delete(0, yLanes.length);
    yLanes.push(state.lanes.map(l => ({ ...l })));

    yPrompts.delete(0, yPrompts.length);
    yPrompts.push(state.prompts.map(p => ({ ...p })));

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
  console.log('[collab] Pulling state from Yjs');

  const yCards = ydoc.getArray('cards');
  const yConnections = ydoc.getArray('connections');
  const yLanes = ydoc.getArray('lanes');
  const yPrompts = ydoc.getArray('prompts');

  state.cards = yCards.toArray().map(c => ({ ...c }));
  state.connections = yConnections.toArray().map(c => ({ ...c }));
  state.lanes = yLanes.toArray().map(l => ({ ...l }));
  state.prompts = yPrompts.toArray().map(p => ({ ...p }));

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
