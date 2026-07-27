// Discovery Canvas — WebSocket relay server
// All state is in-memory only. Nothing is written to disk.
// When the last peer leaves a room, the room and its data are deleted.

import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const PORT = process.env.PORT || 8787;

// ============ In-memory room store ============
// rooms: Map<roomCode, { peers: Map<peerId, {ws, nickname, color}>, state: object|null }>
const rooms = new Map();

let nextPeerId = 1;

function broadcastPresence(room) {
  const peers = [];
  for (const [id, p] of room.peers) {
    peers.push({ clientId: id, nickname: p.nickname, color: p.color });
  }
  const msg = JSON.stringify({ type: 'presence', peers });
  for (const [, p] of room.peers) {
    try { p.ws.send(msg); } catch { /* ignore dead sockets */ }
  }
}

function broadcastExcept(room, excludeId, message) {
  const raw = typeof message === 'string' ? message : JSON.stringify(message);
  for (const [id, p] of room.peers) {
    if (id !== excludeId) {
      try { p.ws.send(raw); } catch { /* ignore */ }
    }
  }
}

// ============ HTTP server with CORS ============
const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ status: 'ok', rooms: rooms.size }));
    return;
  }
  res.writeHead(404).end();
});

// ============ WebSocket server ============
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  const peerId = nextPeerId++;
  let currentRoom = null;
  let currentCode = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      // ---- Create a room ----
      case 'create': {
        const code = msg.room;
        if (!code) return;
        if (currentRoom) leaveRoom();

        if (!rooms.has(code)) {
          rooms.set(code, { peers: new Map(), state: null });
        }
        const room = rooms.get(code);
        room.peers.set(peerId, { ws, nickname: msg.nickname || 'Anonymous', color: msg.color || '#888' });
        currentRoom = room;
        currentCode = code;

        ws.send(JSON.stringify({ type: 'room-created', room: code }));
        broadcastPresence(room);
        break;
      }

      // ---- Join an existing room ----
      case 'join': {
        const code = (msg.room || '').toUpperCase().trim();
        if (!code) return;
        if (currentRoom) leaveRoom();

        if (!rooms.has(code)) {
          rooms.set(code, { peers: new Map(), state: null });
        }
        const room = rooms.get(code);
        room.peers.set(peerId, { ws, nickname: msg.nickname || 'Anonymous', color: msg.color || '#888' });
        currentRoom = room;
        currentCode = code;

        // Send current state to the new joiner (if any exists)
        const joinMsg = { type: 'joined', room: code };
        if (room.state) {
          joinMsg.state = room.state;
        }
        ws.send(JSON.stringify(joinMsg));
        broadcastPresence(room);
        break;
      }

      // ---- State update from a peer ----
      case 'state-update': {
        if (!currentRoom) return;
        // Cache latest state in memory (for late joiners)
        currentRoom.state = msg.state;
        // Broadcast to all other peers
        broadcastExcept(currentRoom, peerId, {
          type: 'state-update',
          state: msg.state,
          from: peerId,
        });
        break;
      }

      default:
        break;
    }
  });

  function leaveRoom() {
    if (!currentRoom) return;
    currentRoom.peers.delete(peerId);

    if (currentRoom.peers.size === 0) {
      // Last peer left — delete room and all its data
      rooms.delete(currentCode);
      console.log(`[relay] Room ${currentCode} deleted (empty)`);
    } else {
      broadcastPresence(currentRoom);
    }
    currentRoom = null;
    currentCode = null;
  }

  ws.on('close', leaveRoom);
  ws.on('error', leaveRoom);
});

httpServer.listen(PORT, () => {
  console.log(`[relay] Discovery Canvas relay server listening on port ${PORT}`);
  console.log(`[relay] No data persistence — all state is in-memory only`);
});
