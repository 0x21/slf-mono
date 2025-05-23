# SelfGrok Overview

**SelfGrok** is a self-hosted reverse proxy tool that allows you to expose local services to the internet through a secure session-based TCP tunnel. Inspired by tools like ngrok, SelfGrok is built in Go and designed for developers who need secure and efficient access to internal applications.

## ⚙️ Architecture Overview

```
Client ⟷ TCP Proxy Server (SLF Server) ⟷ Local Target
          |
          ⬇
        Backend API
          |
          ⬇
        PostgreSQL
```

## 📦 Monorepo Structure

This project is a TurboRepo monorepo with the following packages:

```
apps/
├── backend     → Node.js backend for REST API & connection management
├── web         → Next.js app using App Router + TRPC
├── slf-server  → Go server that handles TCP multiplexing and framing
└── slf-cli     → CLI client to create sessions and forward connections
```

## 🔌 How It Works

### 1. Session Initialization

- The CLI (`slf-cli`) makes a POST request to `/api/connection`.
- Backend allocates a public (external) and internal port and saves the session.
- SLF Server listens for a TCP client (the CLI) on the internal port.
- CLI connects to the internal port and opens a persistent TCP session.

### 2. Framing Protocol

Custom binary frames are used over the TCP stream between client and server.

Each frame has:

```
[ 1 byte ] Type (CONNECT/DATA/CLOSE)
[ 4 bytes ] Stream ID
[ 4 bytes ] Length of payload
[ N bytes ] Payload (optional)
```

Frame types:

- `1` - CONNECT: Initiate a new stream
- `2` - DATA: Send data to stream
- `3` - CLOSE: Close stream

### 3. Multiplexing

- Multiple streams (TCP connections from the internet) are multiplexed over a single TCP connection between client and server.
- The mux server tracks stream IDs and routes data accordingly.

## 📡 CLI Usage

```bash
# Set config
selfgrok config --setToken <your_token> --setServerUrl http://localhost:3000

# Start session
selfgrok session --host localhost --port 3000
```

## 🧪 API Endpoints

| Endpoint              | Method | Description                      |
| --------------------- | ------ | -------------------------------- |
| `/api/connection`     | POST   | Create new connection            |
| `/api/connection/:id` | PATCH  | Update status (e.g. "connected") |
| `/api/connection/:id` | DELETE | Terminate session                |

### Error Format

```json
{
  "success": false,
  "message": "Connection not found",
  "error": "not_found"
}
```

## 🔍 API Testing

All REST requests are defined in [Bruno](https://www.usebruno.com) workspace in this repository under `bruno/`.

## 🛡 Security

- Connections are identified by session ID and validated by API key.
- Only one internal client is allowed per session.
- Connections are closed gracefully on client disconnect or server shutdown.

## 📁 Related Docs

- [README_SLF_CLI.md](./cli)
- [README_SLF_SERVER.md](./server)

---
