const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const Chess = require('chess.js').Chess;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 8743;

app.use(express.static(path.join(__dirname, 'public')));

// Gerenciamento de salas e jogadores
let waitingPlayer = null;
let games = {};

io.on('connection', (socket) => {
  console.log('Novo jogador conectado:', socket.id);

  socket.on('joinGame', () => {
    if (waitingPlayer) {
      // Dois jogadores prontos: criar sala
      const roomId = `room_${waitingPlayer.id}_${socket.id}`;
      socket.join(roomId);
      waitingPlayer.join(roomId);
      // Atribuir cores
      const white = Math.random() < 0.5 ? socket : waitingPlayer;
      const black = white === socket ? waitingPlayer : socket;
      // Criar lógica do jogo
      games[roomId] = {
        chess: new Chess(),
        white: white.id,
        black: black.id
      };
      // Notificar ambos
      white.emit('gameStart', { color: 'white', roomId });
      black.emit('gameStart', { color: 'black', roomId });
      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
      socket.emit('waiting');
    }
  });

  socket.on('move', ({ roomId, from, to, promotion }) => {
    const game = games[roomId];
    if (!game) return;
    const chess = game.chess;
    const move = chess.move({ from, to, promotion: promotion || 'q' });
    if (move) {
      io.to(roomId).emit('move', { from, to, promotion: move.promotion, fen: chess.fen() });
      if (chess.isGameOver()) {
        io.to(roomId).emit('gameOver', { result: chess.result() });
      }
    }
  });

  socket.on('resign', ({ roomId }) => {
    console.log('Evento resign recebido de', socket.id, 'na sala', roomId);
    const game = games[roomId];
    if (!game) return;
    let winner = (socket.id === game.white) ? 'black' : 'white';
    io.to(roomId).emit('resigned', { winner });
    delete games[roomId];
  });

  socket.on('disconnect', () => {
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
    // Limpar jogos se necessário
    Object.keys(games).forEach(roomId => {
      if (games[roomId].white === socket.id || games[roomId].black === socket.id) {
        io.to(roomId).emit('opponentLeft');
        delete games[roomId];
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Private CHESS rodando em http://localhost:${PORT}`);
}); 