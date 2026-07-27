# Discovery Canvas Relay Server

A minimal WebSocket relay server for real-time collaboration on Discovery Canvas.

## Privacy

- **No data is written to disk** — all state is held in-memory only
- When the last participant leaves a room, the room and all its data are deleted
- The server relays messages between connected browsers — it does not log or store canvas content
- If the server restarts, all rooms are gone

## Run locally

```bash
cd server
npm install
npm start
```

The server starts on port `8787` (or set `PORT` env var).

## Deploy to Fly.io

```bash
cd server
fly launch        # first time — creates the app
fly deploy        # subsequent deploys
```

Free tier: 3 shared-CPU VMs, 256MB RAM each. More than enough for this.

## Protocol

WebSocket messages are JSON. Client sends:

| Message | Description |
|---------|-------------|
| `{type: "join", room: "ABC123", nickname: "Alex", color: "#ff0000"}` | Join or create a room |
| `{type: "state-update", state: {...}}` | Broadcast canvas state to all peers |

Server sends:

| Message | Description |
|---------|-------------|
| `{type: "joined", room: "ABC123", state: {...}}` | Joined room, includes cached state if any |
| `{type: "presence", peers: [...]}` | Updated list of connected peers |
| `{type: "state-update", state: {...}, from: 123}` | State update from another peer |

## Health check

```bash
curl http://localhost:8787/health
# {"status":"ok","rooms":0}
```
