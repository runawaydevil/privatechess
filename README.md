# Private CHESS

[![License: MIT NC](https://img.shields.io/badge/license-MIT--NC-blue.svg)](LICENSE.md)
![Status: Active](https://img.shields.io/badge/status-active-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-black?logo=socket.io)
![Docker](https://img.shields.io/badge/Docker-ready-blue?logo=docker)
![PWA](https://img.shields.io/badge/PWA-ready-blueviolet?logo=pwa)
![Languages: PT|EN|RU](https://img.shields.io/badge/languages-PT%20%7C%20EN%20%7C%20RU-yellow)
![Anti-Cheat](https://img.shields.io/badge/Anti--Cheat-Active-red?logo=shield)
![SEO](https://img.shields.io/badge/SEO-Optimized-green?logo=search)

**Live demo:** [https://privatechess.org](https://privatechess.org)

Private CHESS is a secure, anonymous, and privacy-focused online chess game for two players. It features automatic color pairing, private rooms, anonymous chat, move timer, game history, statistics, and a modern web interface. The project is mobile-first, PWA-ready, supports multilingual UI (Portuguese, English, Russian), and includes advanced anti-cheat detection.

## Features

### Core Game Features
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

### Multilingual Support
- **Automatic language detection** based on browser settings
- **Portuguese, English, Russian** with seamless switching
- **Complete interface translation** including anti-cheat messages
- **SEO optimized** for all supported languages
- **No language selection modal** - instant loading

### Anti-Cheat & Fair Play System
- **Real-time engine detection** - Analyzes moves commonly played by chess engines
- **Move timing analysis** - Detects suspiciously fast moves and machine-like consistency
- **Pattern recognition** - Identifies repetitive and artificial move patterns
- **Severity classification** - LOW, MEDIUM, HIGH severity levels for violations
- **Visual notifications** - Color-coded warnings for different violation types
- **Server-side tracking** - Comprehensive logging and analysis
- **Automatic reset** - Anti-cheat system resets for each new game

### Privacy & Security
- **Zero data collection** - No user data stored on server
- **Anonymous gameplay** - No registration required
- **Private rooms** - Secure code-based room system
- **Encrypted communication** - All data transmitted securely
- **Privacy-first design** - Built with privacy as core principle

### Technical Features
- **Real-time communication** via Socket.IO
- **Automatic reconnection** to games after page reload
- **Cross-browser compatibility** - Works on all modern browsers
- **Mobile optimization** - Touch-friendly interface
- **Performance optimized** - Fast loading and smooth gameplay

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

## Anti-Cheat System

The Private CHESS anti-cheat system monitors gameplay in real-time to ensure fair play:

### Detection Methods
- **Engine Move Analysis**: Identifies moves commonly played by chess engines
- **Timing Analysis**: Detects suspiciously fast moves and artificial consistency
- **Pattern Recognition**: Analyzes move sequences for machine-like behavior
- **Statistical Analysis**: Calculates risk scores based on multiple factors

### User Experience
- **Non-intrusive**: Runs in background without affecting gameplay
- **Visual warnings**: Color-coded notifications for different violation levels
- **Multilingual alerts**: Anti-cheat messages in Portuguese, English, and Russian
- **Automatic reset**: System resets for each new game

### Fair Play
- **Transparent**: Users are notified of suspicious activity
- **Educational**: Helps maintain a fair gaming environment
- **Balanced**: Designed to catch cheaters without false positives

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
- `public/lang_*.json`: Translation files for Portuguese, English, Russian
- `public/anti-cheat.js`: Anti-cheat detection system
- `public/seo-multilang.js`: SEO optimization for multiple languages

## Recent Updates (2025)

### v1.2 - Anti-Cheat System
- Implemented comprehensive anti-cheat detection
- Added real-time move analysis and pattern recognition
- Integrated fair play monitoring with visual notifications
- Added multilingual anti-cheat messages

### v1.1 - UX Optimization
- Automatic language detection eliminating selection modal
- Fixed socket connection issues
- Improved footer management during gameplay
- Enhanced SEO implementation with structured data

### v1.0 - Core Features
- Complete multilingual support with automatic detection
- Private room system with secure codes
- Anonymous chat with random names
- Responsive design and PWA capabilities

## Contact & Support

Have questions, suggestions, or need help? Feel free to reach out:

- **Email**: [skullx87@pm.me](mailto:skullx87@pm.me)
- **Website**: [https://pablo.space](https://pablo.space)
- **Live Demo**: [https://privatechess.org](https://privatechess.org)

I'm always happy to help with:
- Installation and deployment issues
- Feature requests and suggestions
- Bug reports
- General questions about the project
- Collaboration opportunities
.
## Credits
- Chess logic: [chess.js](https://github.com/jhlywa/chess.js)
- Board UI: [chessboard.js](https://github.com/oakmac/chessboardjs)
- SVG pieces: Wikimedia Commons
- Developed by [Pablo Murad](https://pablo.space)

## License
MIT License - See [LICENSE.md](LICENSE.md) for details 