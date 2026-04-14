# ZeroTrust Web Security Simulator (ZT-WSS)

A full-stack, role-based web security simulation platform for educational and demonstration purposes. ZT-WSS lets security students and professionals explore common web attack vectors (SQL Injection, XSS, Brute-Force) and observe how Zero-Trust defense controls detect and block them — all in a safe, self-contained environment.

---

> ## ⚠️ Safety Disclaimer
>
> **This application is a SIMULATION ENVIRONMENT for educational and demonstration purposes ONLY.**
> It does **NOT** perform real cyber attacks. All attack simulations run against internal demo endpoints within this application.
> **Do NOT use this tool against any real system or infrastructure you do not own.**
> The authors are not responsible for any misuse.

---

## Features

- 🔐 **JWT-based authentication** with role enforcement (admin / analyst / attacker)
- 💣 **Attack Simulator** — run SQLi, XSS, and Brute-Force simulations against internal demo endpoints
- 🛡️ **Defense Controls** — toggle Rate Limiting, Input Sanitization, CSP, and WAF in real time
- 📋 **Audit Logs** — every request is logged with detection flags and block status
- 🚨 **Alerts Dashboard** — filtered view of warning and critical events
- 📡 **WebSocket live updates** — attack results and logs stream to the UI via Socket.IO
- 🎨 **Responsive React dashboard** with Tailwind CSS

---

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, Socket.IO client  |
| Backend  | Node.js, Express 4, Socket.IO                   |
| Database | MongoDB with Mongoose ODM                       |
| Auth     | JSON Web Tokens (JWT), bcryptjs                 |
| Security | helmet, express-rate-limit, express-mongo-sanitize, xss |

---

## Roles

| Role       | Capabilities                                                     |
| ---------- | ---------------------------------------------------------------- |
| `admin`    | Full access — manage users, toggle defenses, view all logs       |
| `analyst`  | Read-only — view logs, alerts, and defense status                |
| `attacker` | Run attack simulations and view personal attack history          |

---

## Prerequisites

- **Node.js** v18 or higher
- **MongoDB** v6+ running locally (or a MongoDB Atlas URI)
- npm v9+

---

## Installation

```bash
# 1. Clone the repo
git clone https://github.com/rakshit-737/web-security-simulator.git
cd web-security-simulator

# 2. Setup environment
cp .env.example .env
# Edit .env and set MONGODB_URI and JWT_SECRET

# 3. Install all dependencies
cd server && npm install
cd ../client && npm install

# 4. Seed the database
node scripts/seedData.js

# 5. Start development servers
# Terminal 1:
cd server && npm run dev
# Terminal 2:
cd client && npm run dev
```

The API will be available at `http://localhost:5000` and the UI at `http://localhost:5173`.

---

## Default Credentials

| Username   | Password       | Role       |
| ---------- | -------------- | ---------- |
| `admin`    | `Admin@123`    | admin      |
| `analyst`  | `Analyst@123`  | analyst    |
| `attacker` | `Attacker@123` | attacker   |

> **Change these credentials immediately in any non-local deployment.**

---

## API Endpoints

### Authentication — `/api/auth`

| Method | Path      | Auth | Description              |
| ------ | --------- | ---- | ------------------------ |
| POST   | `/login`  | No   | Obtain a JWT token       |
| GET    | `/me`     | Yes  | Get current user profile |

### Attacks — `/api/attacks`

| Method | Path        | Roles                         | Description                      |
| ------ | ----------- | ----------------------------- | -------------------------------- |
| GET    | `/types`    | Public                        | List available attack types      |
| POST   | `/simulate` | `attacker`, `admin`           | Run an attack simulation         |
| GET    | `/history`  | `attacker`, `admin`, `analyst`| View past simulation results     |

### Logs — `/api/logs`

| Method | Path       | Roles              | Description                   |
| ------ | ---------- | ------------------ | ----------------------------- |
| GET    | `/`        | `admin`, `analyst` | Retrieve paginated audit logs |
| GET    | `/alerts`  | `admin`, `analyst` | Retrieve warning/critical logs|

### Defense Controls — `/api/defense`

| Method | Path | Roles   | Description                     |
| ------ | ---- | ------- | ------------------------------- |
| GET    | `/`  | Any auth| Retrieve current defense config |
| PUT    | `/`  | `admin` | Update defense toggles          |

---

## Attack Simulation Examples

```bash
# 1. Login as attacker
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"attacker","password":"Attacker@123"}' | jq -r '.token')

# 2. Run an SQL Injection simulation
curl -X POST http://localhost:5000/api/attacks/simulate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"sqli","payload":"'"'"' OR 1=1 --","options":{"target":"login"}}'

# 3. Run an XSS simulation
curl -X POST http://localhost:5000/api/attacks/simulate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"xss","payload":"<script>alert(1)</script>","options":{"context":"reflected"}}'

# 4. Run a Brute-Force simulation
curl -X POST http://localhost:5000/api/attacks/simulate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"brute-force","payload":"password123","options":{"attempts":10,"target":"admin"}}'
```

---

## Project Structure

```
web-security-simulator/
├── .env.example            # Environment variable template
├── .gitignore
├── package.json            # Root scripts (concurrently for dev)
├── scripts/
│   └── seedData.js         # Database seed script
├── server/                 # Express + Socket.IO API
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   │   ├── attackController.js
│   │   ├── authController.js
│   │   ├── defenseController.js
│   │   └── logController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── rateLimiter.js
│   ├── models/
│   │   ├── Attack.js
│   │   ├── Defense.js
│   │   ├── Log.js
│   │   └── User.js
│   ├── routes/
│   │   ├── attackRoutes.js
│   │   ├── authRoutes.js
│   │   ├── defenseRoutes.js
│   │   └── logRoutes.js
│   ├── services/
│   └── sockets/
└── client/                 # React + Vite frontend
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

