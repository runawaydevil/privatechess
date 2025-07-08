# Private CHESS

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
4. Open your browser and go to [http://localhost:8743](http://localhost:8743)

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