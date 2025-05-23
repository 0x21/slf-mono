# SelfGrok CLI

SelfGrok CLI is a command-line tool that allows users to create secure, self-hosted TCP tunnels to expose local services to the internet. It communicates with a backend API to initiate tunnel sessions and uses a custom TCP framing protocol to multiplex multiple streams over a single persistent connection.

## 📦 Features

- Start and stop tunnel sessions via CLI
- Configurable server URL and API token
- Automatic reconnect handling for unstable connections
- Lightweight and easy to integrate into CI pipelines
- Written in Go using `cobra` for command structure

---

## 🔧 Configuration

Before using any command, configure the CLI with your server and token:

```bash
selfgrok config --setToken <API_TOKEN> --setServerUrl http://your-server.com
```

The config is stored at `~/.selfgrok/config.yaml`.

---

## 🚀 Commands

### `session`

Creates a session by making a POST request to `/api/connection` and starts a reverse TCP connection to the internal port provided by the server.

```bash
selfgrok session --port 3000
```

You can optionally specify a host:

```bash
selfgrok session --host localhost --port 3000
```

This starts a connection loop that keeps trying to reconnect if the connection drops.

---

### `config`

Manages configuration for server and API token.

```bash
selfgrok config --setToken <your_token>
selfgrok config --setServerUrl http://localhost:3000
selfgrok config
```

---

## 🌐 How It Works

1. CLI sends a POST to `/api/connection`.
2. Server responds with `externalPort`, `internalPort`, and `connectionId`.
3. CLI dials `internalPort` as a TCP client and starts a custom framed protocol loop.
4. Server routes external requests (to `externalPort`) through a mux server to the correct local target.
5. CLI reads/writes framed messages:
   - `TypeConnect`
   - `TypeData`
   - `TypeClose`

Framing format is:

| Byte Index | Field     | Size   |
| ---------- | --------- | ------ |
| 0          | Type      | 1 byte |
| 1–4        | Stream ID | 4 byte |
| 5–8        | Length    | 4 byte |
| 9–...      | Payload   | N byte |

---

## 🧪 Bruno Requests

Example requests for API are provided as a `.bru` collection in the repository. Import the `bruno/` folder into Bruno app to test your endpoints.

---

## 📁 Repo Structure (CLI Focus)

```
apps/
├── slf-cli/                # CLI application
│   ├── cmd/                # Cobra command definitions
│   ├── internal/
│   │   ├── config/         # Configuration loading and token storage
│   │   ├── api/            # API client logic
│   │   └── connector/      # TCP framing and stream logic
│   └── main.go             # Entrypoint
```

---

## 🧠 Development Notes

- Written in Go 1.22+
- Uses `cobra` for CLI structure
- Resilient against network drops
- Token is sent via `Authorization: Bearer <token>` header
- Frame-level multiplexing is handled over a single TCP connection

---
