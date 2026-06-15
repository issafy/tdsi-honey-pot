# 🍯 Honeypot Threat Intelligence Dashboard

Docker-based honeypot monitoring system with a **3D globe attack map**. Real-time visualization of cyber attacks with animated arcs, country flags, and live statistics.

![Stack](https://img.shields.io/badge/stack-React%20%2B%20Three.js%20%2B%20Express%20%2B%20Socket.io-blue)
![Docker](https://img.shields.io/badge/docker-compose%20ready-2496ED?logo=docker)

## Architecture

```
                     ┌──────────────────────┐
 Internet ──────────►│   Cowrie SSH (2222)  │──┐
                     │   Web Honeypot (80)  │──┤
                     └──────────────────────┘  │
                                               ▼
┌─────────────────────────────────────────────────────┐
│  Express Backend (:3001)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ REST API │  │Socket.io │  │ Mock Generator   │  │
│  │/api/...  │  │  (WS)    │  │ (dev mode only)  │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│  React Frontend (:5173)                             │
│  ┌──────────────────────────────────────────────┐   │
│  │          🌍 3D Globe (Three.js)              │   │
│  │    • Day/night Earth textures                │   │
│  │    • Animated attack arcs (Bezier curves)    │   │
│  │    • Particle streams + pulse markers        │   │
│  │    • Atmosphere glow shader                  │   │
│  ├──────────────────────────────────────────────┤   │
│  │  TopBar    — live stat counters              │   │
│  │  Sidebar   — scrollable attack feed          │   │
│  │  BottomBar — country + attack type charts    │   │
│  │  Detail    — attack info card on arc click   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose v2+
- Node.js 23+ (for local development without Docker)

### Development (Dashboard Only)

```bash
# Clone and enter
cd honey-pot

# Start dashboard + mock data generator
docker compose up

# Open http://localhost:5173
```

The mock generator produces 30–60 fake attacks/minute so you can see the globe in action immediately.

### With Honeypots (Catches Real Attacks)

```bash
# Start everything: dashboard + SSH honeypot + web honeypot
docker compose --profile honeypot up

# Cowrie SSH:    localhost:2222
# Web honeypot:  localhost:8080
# Dashboard:     localhost:5173
```

---

## Service Reference

| Service | Container | Host Port | Internal | Profile |
|---------|-----------|-----------|----------|---------|
| **Dashboard Frontend** | `hp-frontend` | `5173` | `5173` | *(always on)* |
| **Dashboard Backend** | `hp-backend` | `3001` | `3001` | *(always on)* |
| **Cowrie SSH** | `hp-cowrie` | `2222` | `2222` | `honeypot` |
| **Web Honeypot** | `hp-web-honeypot` | `8080` | `80` | `honeypot` |

### Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check + uptime |
| `GET` | `/api/attacks?limit=50` | Paginated attack list |
| `GET` | `/api/stats` | Aggregate stats (total, /min, top countries) |
| `POST` | `/api/honeypot/event` | Honeypot ingestion endpoint |
| WS | `/socket.io/` | Real-time attack push (`new_attack` event) |

### Web Honeypot Endpoints

The web honeypot exposes fake vulnerable pages that trap and log attackers:

| Path | Attack Type Caught |
|------|-------------------|
| `/login` | Credential stuffing |
| `/admin` | Admin panel probe |
| `/wp-admin/*`, `/wp-login.php` | WordPress brute-force |
| `/phpmyadmin/*` | SQL injection / DB access attempt |
| `/.env` | Config file scraping |
| `/api/v1/users` | API enumeration |
| `*` (catch-all) | Port scan / recon |

### Environment Variables

#### Backend (`backend/.env` or docker-compose)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP server port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |

#### Frontend (`frontend/.env` or docker-compose)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001` | Backend URL |

#### Web Honeypot (`docker-compose`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `80` | Listen port inside container |
| `BACKEND_URL` | `http://backend:3001` | Where to POST attack events |

---

## Production Deployment

### Moving to a VPS

**1. Clone and build:**
```bash
git clone <repo> /opt/honeypot
cd /opt/honeypot
docker compose build
```

**2. Start the dashboard:**
```bash
docker compose up -d
# Dashboard at http://<vps-ip>:5173
```

**3. (Optional) Enable honeypots to catch real attacks:**

```bash
docker compose --profile honeypot up -d
```

**4. Expose standard ports (attract real attackers):**

Edit `docker-compose.yml` and change the port mappings:

```yaml
cowrie:
  ports:
    - "22:2222"     # Honeypot on standard SSH port

web-honeypot:
  ports:
    - "80:80"       # Honeypot on standard HTTP port
```

> ⚠️ **Before taking port 22:** Move your real SSH to a different port (see below).

### Keeping SSH Access While Running Cowrie on Port 22

**Option A — Move real SSH to another port:**
```bash
# 1. Edit /etc/ssh/sshd_config
Port 2222   # Change from 22 to 2222

# 2. Restart SSH
sudo systemctl restart sshd

# 3. Verify you can connect on the new port BEFORE closing your session
ssh -p 2222 user@vps-ip

# 4. Now Cowrie can take port 22
docker compose --profile honeypot up -d
```

**Option B — IP whitelist with iptables (advanced):**

Redirect port 22 traffic to the honeypot only for non-whitelisted IPs:
```bash
# Your trusted IP
TRUSTED_IP="1.2.3.4"

# Redirect everyone else to Cowrie on 2222
iptables -t nat -A PREROUTING -p tcp --dport 22 \
  ! -s $TRUSTED_IP -j REDIRECT --to-port 2222
```

### Production Compose File Adjustments

For production, consider:

```yaml
# Remove dev volumes and hot-reload
backend:
  # Remove:  volumes: - ./backend/src:/app/src
  # Remove:  command: ["npx", "nodemon", ...]
  command: ["node", "src/index.js"]
  restart: unless-stopped

frontend:
  # Remove:  volumes: ...
  # Remove:  command: ["npx", "vite", ...]
  # Use a production build instead:
  command: ["npx", "serve", "-s", "dist", "-l", "5173"]
  restart: unless-stopped
```

Or add a separate `docker-compose.prod.yml` override file.

---

## Project Structure

```
honey-pot/
├── docker-compose.yml              # Orchestrates all services
├── README.md
│
├── backend/                        # Express + Socket.io API
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js                # Entry: HTTP + WS server
│       ├── routes/
│       │   ├── attacks.js          # GET /api/attacks
│       │   ├── stats.js            # GET /api/stats
│       │   └── honeypot.js         # POST /api/honeypot/event
│       ├── services/
│       │   ├── attackGenerator.js  # Mock data (dev)
│       │   └── store.js            # In-memory attack store
│       ├── data/
│       │   ├── fakeIPs.js          # 40 attacker profiles
│       │   └── countries.js        # Country metadata
│       └── utils/
│           └── logger.js           # Structured logger
│
├── frontend/                       # React + Three.js 3D Globe
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── public/textures/
│   │   ├── earth-blue-marble.jpg   # NASA day texture (2048×1024)
│   │   └── earth-night.jpg         # City lights texture (2048×1024)
│   └── src/
│       ├── main.jsx                # React entry
│       ├── App.jsx                 # Root component
│       ├── index.css               # Tailwind + globals
│       ├── store/index.js          # Zustand state
│       ├── api/
│       │   ├── client.js           # HTTP client
│       │   ├── attacks.js          # Attack API calls
│       │   └── socket.js           # Socket.io client
│       ├── components/
│       │   ├── DashboardLayout.jsx # Main layout (CSS grid)
│       │   ├── GlobeContainer.jsx  # R3F Canvas + error boundary
│       │   ├── FlatGlobe.jsx       # 2D SVG fallback (no WebGL)
│       │   ├── ErrorBoundary.jsx   # React error boundary
│       │   ├── globe/
│       │   │   ├── Globe.jsx       # Earth sphere (day+night texture)
│       │   │   ├── Atmosphere.jsx  # Fresnel glow shader
│       │   │   ├── Arc.jsx         # Attack arc (Bezier + dash anim)
│       │   │   ├── ArcLayer.jsx    # Arc lifecycle manager
│       │   │   ├── ParticleStream.jsx # Flowing particles
│       │   │   ├── PulseMarker.jsx # Pulsing rings
│       │   │   └── GlobeControls.jsx # OrbitControls + auto-rotate
│       │   ├── panels/
│       │   │   ├── TopBar.jsx      # Live stat counters
│       │   │   ├── LeftSidebar.jsx # Attack feed with flags
│       │   │   ├── BottomBar.jsx   # Charts (Recharts)
│       │   │   └── AttackDetailCard.jsx # Click-to-inspect
│       │   └── ui/
│       │       ├── Card.jsx        # Card container
│       │       ├── Badge.jsx       # Type/severity/country badges
│       │       └── Spinner.jsx     # Loading spinner
│       ├── hooks/
│       │   ├── useWebSocket.js     # Socket.io hook
│       │   └── useResizeObserver.js
│       └── utils/
│           ├── geoUtils.js         # lat/lon → 3D vector
│           ├── arcMath.js          # Bezier curve math
│           ├── colors.js           # Attack type → color map
│           ├── webgl.js            # WebGL feature detection
│           └── logger.js           # Color-coded console logger
│
└── honeypots/                      # Honeypot services (profile: honeypot)
    ├── cowrie/
    │   ├── Dockerfile
    │   └── cowrie.cfg              # SSH/Telnet honeypot config
    └── web/
        ├── Dockerfile
        ├── package.json
        └── server.js               # HTTP honeypot (fake vulnerable app)
```

---

## Troubleshooting

### 2D fallback instead of 3D globe

WebGL may be disabled in your browser. Check:
- **Chrome**: `chrome://gpu` → look for "WebGL" status
- **Firefox**: `about:support` → "WebGL 1/2 Driver Renderer"
- Common causes: GPU blocklist, VM without GPU passthrough, `--disable-gpu` flag

The 2D SVG fallback is automatic and still shows all attack data.

### WebSocket connection errors

The frontend shows a yellow "Live feed disconnected" banner. This means the backend isn't reachable. Check:
```bash
curl http://localhost:3001/api/health
docker compose logs backend
```

### Port already in use

```bash
# Check what's using the port
ss -tlnp | grep <port>

# Change the host port in docker-compose.yml
ports:
  - "<new-host-port>:<container-port>"
```

### No attacks appearing

- Mock generator starts automatically in dev mode
- If the sidebar is empty: check browser console for API errors
- Verify `curl http://localhost:3001/api/stats` returns data

### Large Docker build context

The `node_modules` and texture files can bloat the build context. The `.dockerignore` file helps, but for faster builds:
```bash
# Create .dockerignore in each service directory:
echo "node_modules" >> backend/.dockerignore
echo "node_modules" >> frontend/.dockerignore
echo "dist" >> frontend/.dockerignore
```

---

## Logging

All services use structured logging with timestamps and tags:

```
[2026-06-15T10:30:00.123Z] [INFO ] [server] Listening on http://0.0.0.0:3001
[2026-06-15T10:30:01.456Z] [INFO ] [http] GET /api/attacks?limit=100 200 4521 - 3.2 ms
[2026-06-15T10:30:02.789Z] [INFO ] [ws] Client connected: aBcDeF (total: 1)
[2026-06-15T10:30:03.012Z] [INFO ] [honeypot] ssh_bruteforce from 91.234.56.78:22
```

**Log levels** (set via `LOG_LEVEL` env var):
- `debug` — attack generation ticks, store evictions
- `info` — connections, HTTP requests, honeypot events
- `warn` — texture load failures, reconnections
- `error` — crashes, connection failures

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| 3D Rendering | Three.js via `@react-three/fiber` + `@react-three/drei` |
| Frontend | React 18, Vite 6, Tailwind CSS 3, Zustand 5 |
| Backend | Express 4, Socket.io 4 |
| Charts | Recharts 2 |
| Honeypots | Cowrie (SSH/Telnet), Custom Node.js (HTTP) |
| Container | Docker Compose, Alpine Linux images |
| Textures | NASA Blue Marble + city lights (2048×1024) |
