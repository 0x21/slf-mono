# SelfGrok Server (`slf-server`)

The `slf-server` is the core service that handles session-based TCP multiplexing and port tunneling logic within the SelfGrok platform. This server is responsible for:

- Accepting TCP connections from authenticated internal clients (CLI users)
- Managing external-facing ports and routing incoming requests
- Multiplexing multiple external streams into a single internal connection using a custom frame protocol

---

## 🧠 Architecture Overview

```text
                ┌────────────────────┐
                │     CLI Client     │
                │  (slf-cli app)     │
                └────────────────────┘
                          │
                          ▼
          [ Internal TCP Connection (Framed) ]
                          │
                          ▼
                ┌────────────────────┐
                │    slf-server      │
                │ (mux & session mg) │
                └────────────────────┘
                        ╱   │
                       ▼    ▼
                     [External TCP]
                      Port :XXXX
```

---

## 🔧 Features

- **Custom Framing Protocol:**
  - Each TCP message is wrapped in a binary frame with headers indicating `type`, `streamID`, and `length`.
- **Session-Based Isolation:**
  - Sessions consist of one internal and one or more external connections.
- **Stream Multiplexing:**
  - Each external TCP connection is assigned a `streamID` and is handled concurrently.

---

## 🧱 Core Components

### 🧩 Frame Format

Each message over TCP uses a 9-byte header + payload:

| Byte Offset | Length | Description                             |
| ----------- | ------ | --------------------------------------- |
| 0           | 1      | Frame Type (1=Connect, 2=Data, 3=Close) |
| 1-4         | 4      | Stream ID                               |
| 5-8         | 4      | Payload Length                          |
| 9+          | N      | Payload (data)                          |

### 📦 Internal Packages

- `mux/` – Implements framed TCP protocol, manages stream maps and data piping
- `session/` – Orchestrates session lifecycle, port listeners, registry
- `frame/` – Binary encoding/decoding helpers for frame struct

---

## 🔁 Session Flow

1. Kafka message triggers `StartSession`
2. `slf-server` opens internal port and waits for CLI
3. On CLI connect, opens external TCP listener
4. Each new connection from internet:
   - A `streamID` is assigned
   - A `CONNECT` frame is sent to the internal client
   - Bi-directional data stream begins

---

## ⚠️ Notes

- Internal port expects framed TCP traffic — raw TCP clients won't work.
- If the CLI disconnects, sessions become invalid unless reconnect logic is implemented.
- Errors are logged in standard output.

---

## ✅ Requirements

- Go 1.20+
- Kafka (used for triggering sessions)
- A reverse proxy is not required (raw TCP handling)

---

## 🔍 Debugging Tips

- Check client logs for `stream not found` errors — may indicate desync
- Server log line: `[mux] got frame: type=X streamID=Y` tracks frame flow
- Restart `slf-server` if internal mux connections hang

---

## 📁 Directory Structure

```
slf-server/
├── cmd/
│   └── proxy-server/
│       └── main.go
├── internal/
│   ├── session/
│   ├── mux/
│   └── frame/
└── go.mod
```

---
