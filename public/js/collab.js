// Collaboration module: Liveblocks Storage for real-time multi-user sessions
// Uses a single CDN import — no Yjs, no module deduplication issues

import { createClient, LiveList, LiveMap, LiveObject } from '@liveblocks/client';
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

let room = null;
let leaveRoomFn = null;
let roomCode = null;
let localNickname = '';
let localColor = '';
let syncing = false; // prevents feedback loops
let storageRoot = null;

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
  if (!room) return [];
  const others = room.getOthers();
  const self = room.getSelf();
  const peers = [];

  if (self && self.presence) {
    peers.push({
      clientId: self.connectionId,
      nickname: self.presence.nickname || 'Anonymous',
      color: self.presence.color || '#888',
      isLocal: true,
    });
  }

  for (const other of others) {
    if (other.presence) {
      peers.push({
        clientId: other.connectionId,
        nickname: other.presence.nickname || 'Anonymous',
        color: other.presence.color || '#888',
        isLocal: false,
      });
    }
  }
  return peers;
}

export function getRoomCode() { return roomCode; }
export function isConnected() { return !!room; }
export function getNickname() { return localNickname; }

// ============ Callbacks ============
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
  if (room) disconnect();

  code = code.toUpperCase().trim();
  if (!isValidRoomCode(code)) {
    throw new Error('Invalid room code. Must be 6 characters (letters + digits).');
  }

  roomCode = code;
  localNickname = nickname || 'Anonymous';
  localColor = PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)];

  const roomId = ROOM_PREFIX + code;
  console.log('[collab] Entering Liveblocks room:', roomId);

  try {
    const result = lbClient.enterRoom(roomId, {
      initialPresence: {
        nickname: localNickname,
        color: localColor,
        joinedAt: Date.now(),
      },
      initialStorage: {
        cards: new LiveList([]),
        connections: new LiveList([]),
        lanes: new LiveList([]),
        prompts: new LiveList([]),
        meta: new LiveObject({ canvasType: 'whiteboard', session: null }),
      },
    });
    room = result.room;
    leaveRoomFn = result.leave;
  } catch (e) {
    console.error('[collab] Failed to enter room:', e);
    throw new Error('Failed to connect. Check browser console for details.');
  }

  console.log('[collab] Room entered, waiting for storage...');

  // Listen for others joining/leaving (presence)
  room.subscribe('others', () => {
    const peers = getPeers();
    console.log('[collab] Others changed, peers:', peers.length);
    if (onPeersChange) onPeersChange(peers);
  });

  // Listen for connection status
  room.subscribe('status', (status) => {
    console.log('[collab] Connection status:', status);
    const connected = status === 'connected';
    if (onConnectionStatusChange) onConnectionStatusChange(connected);
  });

  // Notify UI immediately
  if (onConnectionStatusChange) onConnectionStatusChange(true);
  if (onPeersChange) onPeersChange(getPeers());

  // Get storage and set up sync
  room.getStorage().then((storage) => {
    storageRoot = storage.root;
    console.log('[collab] Storage loaded');

    const liveCards = storageRoot.get('cards');
    const liveLanes = storageRoot.get('lanes');

    // If storage is empty and we have local state, push it
    if (liveCards.length === 0 && state.cards.length > 0) {
      console.log('[collab] First peer — pushing local state');
      pushStateToStorage();
    } else if (liveCards.length > 0) {
      console.log('[collab] Existing state in room — pulling');
      pullStateFromStorage();
    }

    // Subscribe to storage changes from other users
    room.subscribe(storageRoot, () => {
      if (!syncing) {
        console.log('[collab] Remote storage change detected');
        pullStateFromStorage();
      }
    }, { isDeep: true });
  });

  // Save room info to localStorage for reconnect
  localStorage.setItem('collab-room', JSON.stringify({ code, nickname: localNickname }));

  // Register save hook to sync local changes
  setOnSaveHook(() => syncLocalChange());

  return code;
}

// ============ Disconnect ============
export function disconnect() {
  if (leaveRoomFn) {
    leaveRoomFn();
    leaveRoomFn = null;
  }
  room = null;
  storageRoot = null;
  roomCode = null;
  localStorage.removeItem('collab-room');
  setOnSaveHook(null);
  if (onPeersChange) onPeersChange([]);
  if (onConnectionStatusChange) onConnectionStatusChange(false);
}

// ============ Push local state → Liveblocks Storage ============
export function pushStateToStorage() {
  if (!storageRoot) return;
  syncing = true;
  console.log('[collab] Pushing state — cards:', state.cards.length);

  try {
    // Replace cards
    const liveCards = storageRoot.get('cards');
    while (liveCards.length > 0) liveCards.delete(0);
    for (const c of state.cards) liveCards.push({ ...c });

    // Replace connections
    const liveConns = storageRoot.get('connections');
    while (liveConns.length > 0) liveConns.delete(0);
    for (const c of state.connections) liveConns.push({ ...c });

    // Replace lanes
    const liveLanes = storageRoot.get('lanes');
    while (liveLanes.length > 0) liveLanes.delete(0);
    for (const l of state.lanes) liveLanes.push({ ...l });

    // Replace prompts
    const livePrompts = storageRoot.get('prompts');
    while (livePrompts.length > 0) livePrompts.delete(0);
    for (const p of state.prompts) livePrompts.push({ ...p });

    // Meta
    const liveMeta = storageRoot.get('meta');
    liveMeta.set('canvasType', state.canvasType);
    liveMeta.set('session', state.session ? JSON.parse(JSON.stringify(state.session)) : null);
  } catch (e) {
    console.error('[collab] Push failed:', e);
  }

  syncing = false;
}

// ============ Pull Liveblocks Storage → local state ============
function pullStateFromStorage() {
  if (!storageRoot) return;
  syncing = true;
  console.log('[collab] Pulling state from storage');

  try {
    const liveCards = storageRoot.get('cards');
    const liveConns = storageRoot.get('connections');
    const liveLanes = storageRoot.get('lanes');
    const livePrompts = storageRoot.get('prompts');
    const liveMeta = storageRoot.get('meta');

    state.cards = liveCards.toArray().map(c => typeof c === 'object' ? { ...c } : c);
    state.connections = liveConns.toArray().map(c => typeof c === 'object' ? { ...c } : c);
    state.lanes = liveLanes.toArray().map(l => typeof l === 'object' ? { ...l } : l);
    state.prompts = livePrompts.toArray().map(p => typeof p === 'object' ? { ...p } : p);

    const ct = liveMeta.get('canvasType');
    if (ct && ct !== state.canvasType) {
      state.canvasType = ct;
      const sel = document.getElementById('canvasType');
      if (sel) sel.value = ct;
    }
    const sess = liveMeta.get('session');
    if (sess) state.session = JSON.parse(JSON.stringify(sess));

    if (window.__renderAll) window.__renderAll();
    save();
  } catch (e) {
    console.error('[collab] Pull failed:', e);
  }

  syncing = false;
}

// ============ Sync local changes ============
export function syncLocalChange() {
  if (!storageRoot || syncing) return;
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
