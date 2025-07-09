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

// Anti-Cheat System
class AntiCheatSystem {
  constructor() {
    this.suspiciousPatterns = [];
    this.playerStats = {
      moveTimes: [],
      accuracy: [],
      engineMoves: 0,
      suspiciousMoves: 0,
      averageMoveTime: 0,
      consistencyScore: 0
    };
    this.engineMoves = new Set([
      // Moves that are commonly played by engines
      'e4', 'd4', 'Nf3', 'c4', 'g3', 'b3', 'e3', 'd3',
      'Nc3', 'Bc4', 'Bd3', 'Be2', 'O-O', 'O-O-O', 'h3', 'a3'
    ]);
    this.suspiciousThresholds = {
      moveTime: 2000, // 2 seconds for suspiciously fast moves
      accuracy: 0.95, // 95% accuracy is suspicious
      consistency: 0.8, // 80% consistency is suspicious
      engineMoveRatio: 0.7 // 70% engine moves is suspicious
    };
  }

  analyzeMoveTime(moveTime) {
    this.playerStats.moveTimes.push(moveTime);
    
    const totalTime = this.playerStats.moveTimes.reduce((sum, time) => sum + time, 0);
    this.playerStats.averageMoveTime = totalTime / this.playerStats.moveTimes.length;
    
    const suspiciousMoves = this.playerStats.moveTimes.filter(time => 
      time < this.suspiciousThresholds.moveTime
    ).length;
    
    const suspiciousRatio = suspiciousMoves / this.playerStats.moveTimes.length;
    
    if (suspiciousRatio > 0.3) {
      this.flagSuspiciousActivity('FAST_MOVES', {
        ratio: suspiciousRatio,
        averageTime: this.playerStats.averageMoveTime
      });
    }
  }

  analyzeMove(move, position, moveTime) {
    if (this.engineMoves.has(move)) {
      this.playerStats.engineMoves++;
    }
    
    const engineMoveRatio = this.playerStats.engineMoves / this.playerStats.moveTimes.length;
    
    if (engineMoveRatio > this.suspiciousThresholds.engineMoveRatio) {
      this.flagSuspiciousActivity('ENGINE_MOVES', {
        ratio: engineMoveRatio,
        totalMoves: this.playerStats.moveTimes.length
      });
    }
    
    this.analyzeMoveTime(moveTime);
    this.analyzeConsistency();
  }

  analyzeConsistency() {
    if (this.playerStats.moveTimes.length < 5) return;
    
    const times = this.playerStats.moveTimes.slice(-10);
    const variance = this.calculateVariance(times);
    const consistency = 1 - (variance / Math.pow(this.playerStats.averageMoveTime, 2));
    
    this.playerStats.consistencyScore = consistency;
    
    if (consistency > this.suspiciousThresholds.consistency) {
      this.flagSuspiciousActivity('MACHINE_LIKE_CONSISTENCY', {
        consistency: consistency,
        variance: variance
      });
    }
  }

  calculateVariance(times) {
    const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
    const squaredDiffs = times.map(time => Math.pow(time - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / times.length;
  }

  flagSuspiciousActivity(type, data) {
    const suspiciousPattern = {
      type: type,
      timestamp: Date.now(),
      data: data,
      severity: this.calculateSeverity(type, data)
    };
    
    this.suspiciousPatterns.push(suspiciousPattern);
    
    console.warn('Suspicious activity detected:', suspiciousPattern);
    
    // Remove the problematic socket.emit line since this is server-side
    return suspiciousPattern;
  }

  calculateSeverity(type, data) {
    switch (type) {
      case 'FAST_MOVES':
        return data.ratio > 0.5 ? 'HIGH' : data.ratio > 0.3 ? 'MEDIUM' : 'LOW';
      case 'ENGINE_MOVES':
        return data.ratio > 0.8 ? 'HIGH' : data.ratio > 0.7 ? 'MEDIUM' : 'LOW';
      case 'MACHINE_LIKE_CONSISTENCY':
        return data.consistency > 0.9 ? 'HIGH' : data.consistency > 0.8 ? 'MEDIUM' : 'LOW';
      default:
        return 'LOW';
    }
  }

  getRiskScore() {
    if (this.suspiciousPatterns.length === 0) return 0;
    
    const highSeverity = this.suspiciousPatterns.filter(p => p.severity === 'HIGH').length;
    const mediumSeverity = this.suspiciousPatterns.filter(p => p.severity === 'MEDIUM').length;
    const lowSeverity = this.suspiciousPatterns.filter(p => p.severity === 'LOW').length;
    
    return (highSeverity * 3 + mediumSeverity * 2 + lowSeverity * 1) / this.suspiciousPatterns.length;
  }

  reset() {
    this.suspiciousPatterns = [];
    this.playerStats = {
      moveTimes: [],
      accuracy: [],
      engineMoves: 0,
      suspiciousMoves: 0,
      averageMoveTime: 0,
      consistencyScore: 0
    };
  }

  getReport() {
    return {
      riskScore: this.getRiskScore(),
      suspiciousPatterns: this.suspiciousPatterns,
      playerStats: this.playerStats,
      recommendations: this.getRecommendations()
    };
  }

  getRecommendations() {
    const recommendations = [];
    
    if (this.playerStats.engineMoves / Math.max(this.playerStats.moveTimes.length, 1) > 0.7) {
      recommendations.push('High ratio of engine-like moves detected');
    }
    
    if (this.playerStats.consistencyScore > 0.8) {
      recommendations.push('Unusually consistent move timing detected');
    }
    
    const fastMovesRatio = this.playerStats.moveTimes.filter(t => t < 2000).length / 
                          Math.max(this.playerStats.moveTimes.length, 1);
    if (fastMovesRatio > 0.3) {
      recommendations.push('High frequency of very fast moves detected');
    }
    
    return recommendations;
  }
}

// Initialize anti-cheat system
const antiCheat = new AntiCheatSystem();
let moveStartTime = null;

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

  // Add suspicious activity tracking
  let suspiciousActivities = {};

  socket.on('suspiciousActivity', (data) => {
    console.log('Suspicious activity reported:', data);
    
    // Get the room ID from the socket
    const roomId = Array.from(socket.rooms)[1]; // First room is the socket ID
    
    // Track suspicious activities per room
    if (!suspiciousActivities[roomId]) {
      suspiciousActivities[roomId] = [];
    }
    
    suspiciousActivities[roomId].push({
      playerId: socket.id,
      timestamp: Date.now(),
      ...data
    });
    
    // Analyze patterns across the room
    const roomActivities = suspiciousActivities[roomId];
    const highSeverityCount = roomActivities.filter(a => 
      a.severity === 'HIGH' && a.playerId === socket.id
    ).length;
    
    if (highSeverityCount >= 3) {
      // Notify both players about fair play violation
      io.to(roomId).emit('fairPlayViolation', { 
        message: 'Fair play violation detected',
        severity: 'HIGH'
      });
      console.warn('Fair play violation detected in room', roomId);
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Private CHESS rodando em http://127.0.0.1:${PORT}`);
}); 