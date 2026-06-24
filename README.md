# 🍯 Honeypot Threat Intelligence Dashboard

Docker-based honeypot monitoring system with a **3D globe attack map**. Real-time visualization of cyber attacks with animated arcs, country flags, GeoIP resolution, and live statistics.

![Stack](https://img.shields.io/badge/stack-React%20%2B%20Three.js%20%2B%20Express%20%2B%20Socket.io-blue)
![Docker](https://img.shields.io/badge/docker-compose%20ready-2496ED?logo=docker)

## Architecture

```
                     ┌──────────────────────────────────┐
 Internet ──────────►│  Cowrie SSH (22)                 │──┐
      │              │  Web Honeypot (80)               │──┤
      │              │  (profile: honeypot)             │  │
      │              │  Network: hp-honeypot-net        │  │
      │              └──────────────────────────────────┘  │
      │                                                    ▼
      │              ┌──────────────────────────────────────────┐
      └── DROP ──────│  iptables DOCKER-USER chain              │
                     │  ┌──────────────────────────────────┐    │
                     │  │ Your IP → RETURN  │  All else → DROP │
                     │  └──────────────────────────────────┘    │
                     └──────────────────────────────────────────┘
                                               │
                     ┌─────────────────────────▼──────────────┐
                     │  Express Backend (:3001)               │
                     │  Dual-homed: hp-backend-net +          │
                     │              hp-honeypot-net           │
                     │  ┌──────────┐ ┌──────────┐ ┌────────┐ │
                     │  │ REST API │ │Socket.io │ │ GeoIP  │ │
                     │  │/api/...  │ │  (WS)    │ │lookup  │ │
                     │  └──────────┘ └──────────┘ └────────┘ │
                     │         MOCK_ENABLED=true|false        │
                     └──────┬──────────────┬──────────────────┘
                            │              │
            ┌───────────────▼──┐   ┌───────▼──────────────┐
            │  PostgreSQL (:5432)│  │  React Frontend (:5173)│
            │  Attack persistence│  │  ┌─────────────────┐  │
            │  Network:          │  │  │ 🌍 3D Globe     │  │
            │  hp-backend-net    │  │  │ (Three.js)      │  │
            │                    │  │  │ • Bezier arcs   │  │
            └────────────────────┘  │  │ • Particles     │  │
                                    │  │ • Pulses        │  │
                                    │  ├─────────────────┤  │
                                    │  │ TopBar | Sidebar│  │
                                    │  │ BottomBar       │  │
                                    │  └─────────────────┘  │
                                    │  Network: hp-backend-net│
                                    └────────────────────────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose v2+
- `sudo` access (for firewall scripts when testing honeypots)

### Dashboard Only (Mock Data)

```bash
cd honey-pot
docker compose up

# Open http://localhost:5173
```

The mock generator produces 30–60 fake attacks/minute. The globe animates immediately. Attacks are persisted to PostgreSQL and survive restarts.

### Dashboard + Honeypots (Safe, High Ports)

```bash
docker compose --profile honeypot up

# Cowrie SSH:    localhost:2222
# Web honeypot:  localhost:8080
# Dashboard:     localhost:5173
```

No firewall needed — nothing is exposed on standard ports.

---

## Safe Testing: Expose Honeypots, Block Everyone Except You

Run honeypots on **standard ports (22, 80)** while iptables blocks every IP except yours. Ideal for testing on a VPS before opening to the world.

### Step-by-step

```bash
# 1. Find your IP
curl -s ifconfig.me
# → 1.2.3.4

# 2. Start dashboard (safe, no honeypots yet)
docker compose up -d

# 3. Activate the firewall — blocks ports 22, 80, 2222, 8080
sudo ./scripts/firewall-up.sh 1.2.3.4

# 4. Start honeypots on standard ports (mocks auto-disabled)
docker compose -f docker-compose.yml -f docker-compose.exposed.yml --profile honeypot up -d

# 5. Test — you attacking yourself
ssh -p 22 root@localhost          # any credentials logged
curl http://localhost/login
curl -X POST http://localhost/wp-login.php -d 'log=admin&pwd=hunter2'
curl http://localhost/.env
curl http://localhost/phpmyadmin/

# 6. Watch live
# Open http://localhost:5173 — your attacks appear as arcs
```

### Manual Attack Testing

Once honeypots are running, you can generate attacks to verify the dashboard captures them. The mock generator is automatically disabled (`MOCK_ENABLED=false`) when using the exposed override, so only real events appear.

#### SSH Brute-Force (Cowrie)

Install `sshpass` first: `sudo apt install sshpass`

**Standard ports** (with `docker-compose.exposed.yml`):
```bash
# Common usernames with weak passwords
sshpass -p 'password123' ssh -o StrictHostKeyChecking=no -p 22 root@localhost
sshpass -p 'admin123'   ssh -o StrictHostKeyChecking=no -p 22 admin@localhost
sshpass -p 'toor'       ssh -o StrictHostKeyChecking=no -p 22 root@localhost
sshpass -p 'ubuntu'     ssh -o StrictHostKeyChecking=no -p 22 ubuntu@localhost
sshpass -p 'test'       ssh -o StrictHostKeyChecking=no -p 22 test@localhost
sshpass -p 'oracle'     ssh -o StrictHostKeyChecking=no -p 22 oracle@localhost
sshpass -p 'postgres'   ssh -o StrictHostKeyChecking=no -p 22 postgres@localhost
```

**High ports** (dashboard-only `docker compose --profile honeypot up`):
```bash
sshpass -p 'password123' ssh -o StrictHostKeyChecking=no -p 2222 root@localhost
sshpass -p 'admin123'   ssh -o StrictHostKeyChecking=no -p 2222 admin@localhost
sshpass -p 'toor'       ssh -o StrictHostKeyChecking=no -p 2222 root@localhost
```

**Batch script** — fires 10 rapid attempts:
```bash
for user in root admin ubuntu test oracle postgres nginx git mysql; do
  sshpass -p 'password123' ssh -o StrictHostKeyChecking=no \
    -o ConnectTimeout=3 -p 2222 $user@localhost 2>&1
  sleep 0.2
done
```

#### Telnet (Cowrie)

```bash
# Interactive session
telnet localhost 2223
# Type: root / admin / ls / whoami / cat /etc/passwd

# Scripted
{ echo "root"; echo "password123"; echo "ls -la"; echo "cat /etc/shadow"; sleep 1; } | nc localhost 2223
```

#### HTTP Attacks (Web Honeypot)

**Standard ports** (port 80):
```bash
# Credential stuffing
curl -X POST http://localhost/login -d 'username=admin&password=hunter2'

# WordPress brute-force
curl -X POST http://localhost/wp-login.php -d 'log=admin&pwd=password123'
curl -X POST http://localhost/wp-admin/admin-post.php -d 'action=exploit'

# Config file scraping
curl http://localhost/.env
curl http://localhost/.git/config
curl http://localhost/backup.zip

# Admin panel probes
curl http://localhost/admin
curl http://localhost/phpmyadmin/
curl http://localhost/phpMyAdmin/index.php
curl http://localhost/wp-admin/

# API enumeration
curl http://localhost/api/v1/users
curl http://localhost/graphql
curl http://localhost/.aws/credentials

# SQL injection attempts
curl "http://localhost/login?user=admin'%20OR%201=1--"
curl -X POST http://localhost/search -d 'q=1 UNION SELECT password FROM users'
```

**High ports** (port 8080):
```bash
curl -X POST http://localhost:8080/login -d 'username=admin&password=hunter2'
curl http://localhost:8080/wp-login.php
curl http://localhost:8080/.env
curl http://localhost:8080/admin
```

#### Verify Attacks in Dashboard

```bash
# Check attacks were ingested
curl -s http://localhost:3001/api/stats | python3 -m json.tool

# View latest 10 attacks
curl -s 'http://localhost:3001/api/attacks?limit=10' | python3 -m json.tool

# Check DB persistence
curl -s http://localhost:3001/api/health
# → {"status":"ok","uptime":42.1,"db":true}
```

### How the Firewall Works

`sudo ./scripts/firewall-up.sh 1.2.3.4` creates rules in the **`DOCKER-USER`** chain — the chain Docker provides for user rules that run *before* Docker's own `DOCKER` chain in the FORWARD table:

```
Packet → PREROUTING (Docker DNAT) → FORWARD → DOCKER-USER (ours) → DOCKER (Docker's)
                                                  │
                                     ┌────────────┼────────────┐
                                     ▼            ▼             ▼
                              ESTABLISHED    1.2.3.4       Everything
                              /RELATED     (whitelisted)      else
                              → RETURN      → RETURN        → DROP ✗
```

The `DOCKER-USER` chain is used because Docker's `-p` flag routes traffic through FORWARD (not INPUT). An `INPUT`-only firewall would miss traffic heading to containers.

### Verify the Firewall

```bash
# Check rules are active with packet counters
sudo iptables -L DOCKER-USER -n -v

# From your IP → works
curl --connect-timeout 3 http://<vps>:80

# From any other machine / phone hotspot → times out
curl --connect-timeout 3 http://<vps>:80
```

### Tear Down

```bash
docker compose -f docker-compose.yml -f docker-compose.exposed.yml --profile honeypot down
sudo ./scripts/firewall-down.sh
```

`firewall-down.sh` flushes the `DOCKER-USER` chain — all traffic passes through to Docker's default ACCEPT again.

---

## GeoIP Resolution

The backend uses `geoip-lite` to resolve attack source IPs to geographic coordinates for arc positioning on the globe.

| IP Type | Resolution |
|---------|-----------|
| Real public IP | Country + lat/lon from GeoIP database |
| `127.0.0.1` / `localhost` | Cycles through fallback countries (🇷🇺 🇨🇳 🇮🇷 🇰🇵 🇧🇷 🇳🇬 🇮🇳 🇻🇳) |
| Docker internal (`172.x`) | Same fallback cycle (Docker bridge IPs can't be geolocated) |

**Note:** When testing from the same host, `localhost`/Docker IPs hit the fallback — this is intentional so self-testing still produces visible arcs from varied origins. In production behind a reverse proxy with `X-Forwarded-For`, real attacker IPs resolve to their actual countries.

---

## Service Reference

| Service | Container | Host Port | Internal | Profile |
|---------|-----------|-----------|----------|---------|
| **Dashboard Frontend** | `hp-frontend` | `5173` | `5173` | *(always on)* |
| **Dashboard Backend** | `hp-backend` | `3001` | `3001` | *(always on)* |
| **PostgreSQL** | `hp-postgres` | `5433` | `5432` | *(always on)* |
| **Cowrie SSH** | `hp-cowrie` | `2222` | `2222` | `honeypot` |
| **Web Honeypot** | `hp-web-honeypot` | `8080` | `80` | `honeypot` |

With `docker-compose.exposed.yml` override:

| Service | Host Port | Internal |
|---------|-----------|----------|
| **Cowrie SSH** | `22` | `2222` |
| **Cowrie Telnet** | `23` | `2223` |
| **Web Honeypot** | `80` | `80` |

### Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check + uptime + DB status (`{status, uptime, db}`) |
| `GET` | `/api/attacks?limit=50` | Paginated attack list |
| `GET` | `/api/stats` | Aggregate stats (total, /min, top countries) |
| `POST` | `/api/honeypot/event` | Honeypot ingestion — resolves IP via GeoIP, broadcasts via WS |
| WS | `/socket.io/` | Real-time attack push (`new_attack` event) |

### Web Honeypot Endpoints

The web honeypot exposes fake vulnerable pages. Every hit is logged and sent to the backend as an attack event.

| Path | Attack Type Caught |
|------|-------------------|
| `/login` | Credential stuffing |
| `/admin` | Admin panel probe |
| `/wp-admin/*`, `/wp-login.php` | WordPress brute-force |
| `/phpmyadmin/*` | SQL injection / DB access attempt |
| `/.env` | Config file scraping |
| `/api/v1/users` | API enumeration |
| `*` (catch-all) | Recon / port scan |

### Environment Variables

#### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP server port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `MOCK_ENABLED` | `"true"` | Generate fake attacks (`"false"` when honeypots are running) |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `DB_HOST` | `postgres` | PostgreSQL hostname |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `honeypot` | PostgreSQL database name |
| `DB_USER` | `honeypot` | PostgreSQL user |
| `DB_PASSWORD` | `honeypot123` | PostgreSQL password |

#### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001` | Backend URL |

#### Web Honeypot

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `80` | Listen port inside container |
| `BACKEND_URL` | `http://backend:3001` | Where to POST attack events |

---

## Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Base: dashboard + backend + PostgreSQL. `MOCK_ENABLED=true`. Honeypots on high ports. Two Docker networks isolate honeypots from management services. |
| `docker-compose.exposed.yml` | Override: honeypots on ports 22/80. `MOCK_ENABLED=false`. Requires firewall. |

**Dashboard only:**
```bash
docker compose up
```

**Honeypots on high ports (no firewall needed):**
```bash
docker compose --profile honeypot up
```

**Honeypots on standard ports (firewall required):**
```bash
sudo ./scripts/firewall-up.sh <your-ip>
docker compose -f docker-compose.yml -f docker-compose.exposed.yml --profile honeypot up
```

---

## Production Deployment

Only do this on a **dedicated cloud VPS**, not your home network.

### 1. Move real SSH off port 22

```bash
sudo sed -i 's/^#Port 22/Port 2222/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# ⚠️ VERIFY you can connect on the new port BEFORE closing your session:
ssh -p 2222 user@<vps-ip>
```

### 2. Deploy

```bash
docker compose -f docker-compose.yml -f docker-compose.exposed.yml --profile honeypot up -d
```

The `exposed.yml` override sets `MOCK_ENABLED=false` — only real attacks appear.

### 3. (Optional) Restrict to trusted IPs

```bash
sudo ./scripts/firewall-up.sh 1.2.3.4
# Now only 1.2.3.4 can reach ports 22/80. Everyone else gets DROP.
```

### Production Compose Adjustments

For production, remove dev volumes and enable restarts:

```yaml
# docker-compose.prod.yml
services:
  backend:
    command: ["node", "src/index.js"]
    restart: unless-stopped

  frontend:
    command: ["npx", "serve", "-s", "dist", "-l", "5173"]
    restart: unless-stopped

  cowrie:
    restart: unless-stopped

  web-honeypot:
    restart: unless-stopped
```

```bash
docker compose -f docker-compose.yml -f docker-compose.exposed.yml -f docker-compose.prod.yml --profile honeypot up -d
```

---

## Project Structure

```
honey-pot/
├── docker-compose.yml              # Base: dashboard + backend
├── docker-compose.exposed.yml      # Override: standard ports + mock off
├── README.md
├── scripts/
│   ├── firewall-up.sh              # iptables DOCKER-USER whitelist
│   └── firewall-down.sh            # Remove iptables rules
│
├── backend/                        # Express + Socket.io + GeoIP + PostgreSQL
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js                # Entry: HTTP + WS server, DB init on startup
│       ├── routes/
│       │   ├── attacks.js          # GET /api/attacks?limit=N (from DB)
│       │   ├── stats.js            # GET /api/stats (aggregated from DB)
│       │   └── honeypot.js         # POST /api/honeypot/event (GeoIP → DB)
│       ├── services/
│       │   ├── attackGenerator.js  # Mock data (MOCK_ENABLED=true)
│       │   ├── db.js               # PostgreSQL pool + migration + health check
│       │   └── store.js            # Attack CRUD against PostgreSQL
│       ├── data/
│       │   ├── fakeIPs.js          # 40 attacker profiles (mock)
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
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── store/index.js          # Zustand state
│       ├── api/                    # REST client + Socket.io
│       ├── components/
│       │   ├── DashboardLayout.jsx
│       │   ├── GlobeContainer.jsx  # R3F Canvas + WebGL fallback
│       │   ├── FlatGlobe.jsx       # 2D SVG fallback (no WebGL)
│       │   ├── ErrorBoundary.jsx
│       │   ├── globe/              # Globe, Arc, ArcLayer, ParticleStream,
│       │   │                       # PulseMarker, Atmosphere, GlobeControls
│       │   ├── panels/             # TopBar, LeftSidebar, BottomBar,
│       │   │                       # AttackDetailCard
│       │   └── ui/                 # Card, Badge (with flag emojis), Spinner
│       ├── hooks/                  # useWebSocket, useResizeObserver
│       └── utils/                  # geoUtils, arcMath, colors, webgl, logger
│
└── honeypots/                      # Honeypot services (profile: honeypot)
    ├── cowrie/
    │   ├── Dockerfile
    │   └── cowrie.cfg              # SSH/Telnet config
    └── web/
        ├── Dockerfile
        ├── package.json
        └── server.js               # Fake vulnerable web app
```

---

## Troubleshooting

### 2D fallback instead of 3D globe

WebGL may be disabled. Check:
- **Chrome**: `chrome://gpu` → "WebGL" status
- **Firefox**: `about:support` → "WebGL Driver Renderer"
- Common causes: GPU blocklist, VM without GPU passthrough, `--disable-gpu` flag

The 2D SVG fallback is automatic and still shows all attack data.

### WebSocket connection errors

Yellow "Live feed disconnected" banner means the backend isn't reachable:
```bash
curl http://localhost:3001/api/health
docker compose logs backend
```

### Port already in use

```bash
ss -tlnp | grep <port>
# Change host port in docker-compose.yml:  "<new-port>:<container-port>"
```

### No attacks appearing

- **Dashboard-only**: `MOCK_ENABLED=true` (default) — fake attacks should appear within seconds
- **With honeypots**: `docker-compose.exposed.yml` sets `MOCK_ENABLED=false` — only real honeypot events appear. Test with `ssh -p 22 root@localhost` or `curl http://localhost/login`
- Verify: `curl http://localhost:3001/api/stats`

### Firewall verification

```bash
# Check DOCKER-USER chain
sudo iptables -L DOCKER-USER -n -v

# Check INPUT chain (defense-in-depth)
sudo iptables -L INPUT -n -v | grep HONEYPOT

# Test from your IP (should work)
curl --connect-timeout 3 http://<vps>:80

# Test from another IP / phone hotspot (should timeout)
curl --connect-timeout 3 http://<vps>:80
```

### Arcs drift / appear in the ocean

This means `sourceLat: 0, sourceLon: 0` — the IP wasn't resolved. The backend uses `geoip-lite` for GeoIP. For localhost/Docker IPs, it cycles through fallback countries. If a real public IP isn't resolving, the `geoip-lite` database may need updating: `npm update geoip-lite` in the backend.

### NaN / computeBoundingSphere errors in browser console

This happens when attack coordinate fields are missing or `undefined` (e.g., `sourceLat` is `undefined`). The backend maps PostgreSQL `snake_case` columns to `camelCase` for the frontend. If you see this after schema changes, make sure `store.js`'s `rowToAttack()` mapper covers all fields the frontend expects.

### PostgreSQL connection refused

The backend retries up to 10 times with a 1-second delay. If it still fails:
```bash
docker compose logs postgres   # check PG is healthy
docker compose logs backend    # check for connection errors
```

---

## Logging

All services use structured logging with timestamps and tags:

```
[2026-06-15T10:30:00.123Z] [INFO ] [server]   Listening on http://0.0.0.0:3001 | WebSocket ready
[2026-06-15T10:30:01.456Z] [INFO ] [http]     GET /api/attacks?limit=100 200 4521 - 3.2 ms
[2026-06-15T10:30:02.789Z] [INFO ] [ws]       Client connected: aBcDeF (total: 1)
[2026-06-15T10:30:03.012Z] [INFO ] [honeypot] ssh_bruteforce from 91.234.56.78 (RU: 55.8°, 37.6°) → port 22
[2026-06-15T10:30:04.000Z] [INFO ] [generator] Mock generator disabled — waiting for real honeypot events
```

**Log levels** (`LOG_LEVEL` env var): `debug` | `info` | `warn` | `error`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| 3D Rendering | Three.js via `@react-three/fiber` + `@react-three/drei` |
| Frontend | React 18, Vite 6, Tailwind CSS 3, Zustand 5 |
| Backend | Express 4, Socket.io 4, pg (node-postgres), geoip-lite |
| Database | PostgreSQL 17 (Alpine) |
| Charts | Recharts 2 |
| Honeypots | Cowrie (SSH/Telnet), Custom Node.js (HTTP) |
| Container | Docker Compose, Alpine Linux images |
| Textures | NASA Blue Marble + city lights (2048×1024) |
| Firewall | iptables DOCKER-USER chain |
