const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const Chess = require('chess.js').Chess;
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

function getRandomName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: ' ',
    style: 'capital'
  });
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 8743;

app.use(express.static(path.join(__dirname, 'public')));

// Gerenciamento de salas e jogadores
let waitingPlayer = null;
let games = {};
let disconnectTimers = {};

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

let privateRooms = {};

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
      // Gerar nomes aleatórios
      const whiteName = getRandomName();
      let blackName;
      do { blackName = getRandomName(); } while (blackName === whiteName);
      // Criar lógica do jogo
      games[roomId] = {
        chess: new Chess(),
        white: white.id,
        black: black.id,
        whiteName,
        blackName
      };
      // Notificar ambos
      white.emit('gameStart', { color: 'white', roomId, myChatName: whiteName, opponentChatName: blackName });
      black.emit('gameStart', { color: 'black', roomId, myChatName: blackName, opponentChatName: whiteName });
      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
      socket.emit('waiting');
    }
  });

  socket.on('createRoom', () => {
    let code;
    do {
      code = generateRoomCode();
    } while (privateRooms[code]);
    privateRooms[code] = { creator: socket, opponent: null };
    socket.join(code);
    socket.emit('roomCreated', { code });
  });

  socket.on('joinRoom', ({ code }) => {
    code = code.toUpperCase();
    const room = privateRooms[code];
    if (!room) {
      socket.emit('roomError', { message: 'Sala não encontrada.' });
      return;
    }
    if (room.opponent) {
      socket.emit('roomError', { message: 'Sala já está cheia.' });
      return;
    }
    room.opponent = socket;
    socket.join(code);
    // Atribuir cores aleatoriamente
    const white = Math.random() < 0.5 ? room.creator : room.opponent;
    const black = white === room.creator ? room.opponent : room.creator;
    // Gerar nomes aleatórios
    const whiteName = getRandomName();
    let blackName;
    do { blackName = getRandomName(); } while (blackName === whiteName);
    games[code] = {
      chess: new Chess(),
      white: white.id,
      black: black.id,
      whiteName,
      blackName
    };
    white.emit('gameStart', { color: 'white', roomId: code, myChatName: whiteName, opponentChatName: blackName });
    black.emit('gameStart', { color: 'black', roomId: code, myChatName: blackName, opponentChatName: whiteName });
    delete privateRooms[code];
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

  socket.on('chatMessage', ({ roomId, text }) => {
    const game = games[roomId];
    if (!game) return;
    let name = '';
    let type = 'spectator';
    if (socket.id === game.white) {
      name = game.whiteName;
      type = 'player';
    } else if (socket.id === game.black) {
      name = game.blackName;
      type = 'player';
    } else {
      name = 'Visitante';
    }
    io.to(roomId).emit('chatMessage', { name, text, type, senderId: socket.id });
  });

  socket.on('reconnectToRoom', ({ roomId, color }) => {
    const game = games[roomId];
    if (!game) return;
    // Atualiza o id do socket reconectado
    if (color === 'white') game.white = socket.id;
    else if (color === 'black') game.black = socket.id;
    socket.join(roomId);
    // Cancela timer de desconexão
    if (disconnectTimers[roomId]) {
      clearTimeout(disconnectTimers[roomId]);
      delete disconnectTimers[roomId];
    }
    // Notifica ambos
    io.to(roomId).emit('opponentReconnected');
  });

  socket.on('disconnect', () => {
    // Remover sala privada se o criador sair antes de alguém entrar
    Object.keys(privateRooms).forEach(code => {
      if (privateRooms[code].creator.id === socket.id && !privateRooms[code].opponent) {
        delete privateRooms[code];
      }
    });
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
    // Lógica de desconexão temporária
    Object.keys(games).forEach(roomId => {
      const game = games[roomId];
      if (game.white === socket.id || game.black === socket.id) {
        // Avisar adversário e iniciar timer de 2 minutos
        io.to(roomId).emit('opponentDisconnected', { timeout: 120 });
        disconnectTimers[roomId] = setTimeout(() => {
          // Se não reconectar em 2 minutos, vitória do adversário
          let winner = (socket.id === game.white) ? 'black' : 'white';
          io.to(roomId).emit('resigned', { winner });
          delete games[roomId];
          delete disconnectTimers[roomId];
        }, 120000);
      }
    });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Private CHESS rodando em http://127.0.0.1:${PORT}`);
}); 