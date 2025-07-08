# Private CHESS

[![License: MIT NC](https://img.shields.io/badge/license-MIT--NC-blue.svg)](LICENSE.md)
![Status: Active](https://img.shields.io/badge/status-active-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-black?logo=socket.io)
![Docker](https://img.shields.io/badge/Docker-ready-blue?logo=docker)
![PWA](https://img.shields.io/badge/PWA-ready-blueviolet?logo=pwa)
![Languages: PT|EN|RU](https://img.shields.io/badge/languages-PT%20%7C%20EN%20%7C%20RU-yellow)

**Live demo:** [https://privatechess.org](https://privatechess.org)

Private CHESS is a secure, anonymous, and privacy-focused online chess game for two players. It features automatic color pairing, private rooms, anonymous chat, move timer, game history, statistics, and a modern web interface. The project is mobile-first, PWA-ready, and supports multilingual UI (Portuguese, English, Russian).

## Features
- Anonymous, secure, and private chess matches
- Automatic color pairing
- Private rooms with code
- Anonymous chat with random names
- Move timer (starts after first move)
- Game history and statistics
- Resign button and victory overlay
- Export board snapshot as PNG (with watermark and move list)
- No game data or snapshots are stored on the server
- Responsive (mobile-first)
- PWA (installable on mobile/desktop)
- Multilingual interface: Portuguese, English, Russian
- Privacy notice banner

## How to Use

### Local (Node.js)
1. Clone this repository:
   ```bash
   git clone <repo-url>
   cd PrivateCHESS
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
4. Open your browser and go to [http://127.0.0.1:8743](http://127.0.0.1:8743)

### Using Docker
1. Build the image:
   ```bash
   docker build -t privatechess .
   ```
2. Run the container:
   ```bash
   docker run -p 8743:8743 privatechess
   ```
3. Access in your browser: [http://127.0.0.1:8743](http://127.0.0.1:8743)

> **Note:** Docker Compose is **not required** for this project, since it consists of a single service. Use Compose only if you plan to add more services in the future.

## Tips & Production Deployment

- **HTTPS is strongly recommended** for public deployments. Use a reverse proxy (like Nginx or Caddy) to provide SSL/TLS.
- **Example Nginx reverse proxy config:**
  ```nginx
  server {
    listen 443 ssl;
    server_name yourdomain.com;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
      proxy_pass http://127.0.0.1:8743;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }
  }
  ```
- **Environment variables:**
  - You can set the port by changing the `PORT` variable in `server.js` if needed.
- **Firewall:**
  - Open only the necessary port (default: 8743) on your server.
- **Scaling:**
  - For more users, use a process manager (like PM2) or Docker orchestration (Swarm, Kubernetes).
- **Logs:**
  - By default, logs are printed to stdout. For production, consider redirecting logs to a file or log management system.
- **Updates:**
  - To update, pull the latest code and rebuild/restart the container or Node.js process.
- **Privacy:**
  - No user data is stored. For extra privacy, run behind a proxy with access logs disabled.

## Project Structure
- `server.js`: Node.js backend with Express and Socket.IO
- `public/`: Frontend static files (HTML, JS, CSS, chess assets)
- `public/lang_*.json`: Translation files

## Credits
- Chess logic: [chess.js](https://github.com/jhlywa/chess.js)
- Board UI: [chessboard.js](https://github.com/oakmac/chessboardjs)
- SVG pieces: Wikimedia Commons
- Developed by Pablo Murad

## License
MIT License 