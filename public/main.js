// Inicializar socket no início do arquivo
const socket = io();

let board = null;
let game = null;
let myColor = null;
let roomId = null;
let whiteSeconds = 0;
let blackSeconds = 0;
let whiteInterval = null;
let blackInterval = null;
const whiteTimerSpan = document.getElementById('white-timer');
const blackTimerSpan = document.getElementById('black-timer');

const statusDiv = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const moveList = document.getElementById('move-list');
const moveCountSpan = document.getElementById('move-count');
const captureCountSpan = document.getElementById('capture-count');
const checkCountSpan = document.getElementById('check-count');
const historyDiv = document.getElementById('history');
const statsDiv = document.getElementById('stats');
const resignBtn = document.getElementById('resignBtn');
const victoryOverlay = document.getElementById('victory-overlay');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomCodeInput = document.getElementById('roomCodeInput');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const privateRoomControls = document.getElementById('private-room-controls');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
let myChatName = '';
let opponentChatName = '';

const exportPgnBtn = document.getElementById('exportPgnBtn');
const exportFenBtn = document.getElementById('exportFenBtn');
const snapshotBtn = document.getElementById('snapshotBtn');
const exportModal = document.getElementById('exportModal');
const exportContent = document.getElementById('exportContent');
const downloadExportBtn = document.getElementById('downloadExportBtn');
const copyExportBtn = document.getElementById('copyExportBtn');
let lastSnapshotCanvas = null;

// Supondo que o timer está em um elemento com id 'timers'
const timersDiv = document.getElementById('timers');
timersDiv.style.display = 'none';

const chatDiv = document.getElementById('chat');
chatDiv.style.display = 'none';

const manifestoBtn = document.getElementById('manifestoBtn');
const manifestoContainer = document.getElementById('manifesto-container');
const manifestoTitle = document.getElementById('manifesto-title');
const manifestoText = document.getElementById('manifesto-text');
const manifestoLogoLink = document.getElementById('manifesto-logo-link');
const mainContent = [
  document.querySelector('h1'),
  document.getElementById('privacy-banner'),
  document.getElementById('private-room-controls'),
  document.getElementById('status'),
  document.getElementById('startBtn'),
  document.getElementById('resignBtn'),
  document.getElementById('game-area'),
  document.getElementById('victory-overlay'),
  document.getElementById('exportModal'),
  document.querySelector('footer')
];

function showManifesto(show) {
  if (show) {
    // Remover assinatura e nome do texto do manifesto
    let text = t('manifesto_text').replace(/\n?PrivateChess\.org\n—? ?Pablo Murad|\n?PrivateChess\.org\n—? ?Пабло Мурад|\n?PrivateChess\.org\n—? ?Pablo Murad/gi, '').trim();
    manifestoTitle.textContent = t('manifesto_title');
    manifestoText.textContent = text;
    manifestoContainer.style.display = '';
    document.getElementById('manifesto-signature').style.display = '';
    mainContent.forEach(e => { if(e) e.style.display = 'none'; });
  } else {
    manifestoContainer.style.display = 'none';
    document.getElementById('manifesto-signature').style.display = 'none';
    mainContent.forEach(e => { if(e) e.style.display = ''; });
  }
}

manifestoBtn.onclick = () => showManifesto(true);
manifestoLogoLink.onclick = (e) => { e.preventDefault(); showManifesto(false); };

startBtn.onclick = () => {
  socket.emit('joinGame');
  startBtn.disabled = true;
  statusDiv.textContent = t('waiting_for_opponent');
  
  // Ocultar footer quando aguardando jogo
  const footer = document.querySelector('footer');
  if (footer) footer.style.display = 'none';
};

socket.on('waiting', () => {
  statusDiv.textContent = t('waiting_for_opponent');
  
  // Ocultar footer quando aguardando
  const footer = document.querySelector('footer');
  if (footer) footer.style.display = 'none';
});

createRoomBtn.onclick = () => {
  console.log('Botão Criar Sala Privada clicado');
  socket.emit('createRoom');
  // Não desabilitar botões ainda
  statusDiv.textContent = t('waiting_for_opponent_to_join');
  
  // Ocultar footer quando aguardando jogo
  const footer = document.querySelector('footer');
  if (footer) footer.style.display = 'none';
};

// Recebe o código da sala criada
socket.on('roomCreated', ({ code }) => {
  console.log('Código da sala recebido:', code);
  alert('DEBUG: Evento roomCreated chamado. Código da sala: ' + code);
  roomCodeDisplay.style.display = '';
  roomCodeDisplay.textContent = t('room_code', { code: code });
  roomCodeInput.value = code;
  createRoomBtn.disabled = true;
  joinRoomBtn.disabled = true;
  startBtn.disabled = true;

  // Exibir link de convite (forçar exibição para debug)
  const inviteLinkDisplay = document.getElementById('inviteLinkDisplay');
  if (inviteLinkDisplay) {
    const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
    inviteLinkDisplay.innerHTML = `<span>Link de convite: <a href='${url}' target='_blank'>${url}</a> <button id='copyInviteBtn' style='font-size:0.95em;margin-left:6px;'>Copiar</button></span>`;
    inviteLinkDisplay.style.display = 'block'; // Forçar exibição
    setTimeout(() => {
      const btn = document.getElementById('copyInviteBtn');
      if (btn) {
        btn.onclick = () => {
          navigator.clipboard.writeText(url);
          btn.textContent = 'Copiado!';
          setTimeout(() => { btn.textContent = 'Copiar'; }, 1200);
        };
      }
    }, 100);
  } else {
    alert('DEBUG: inviteLinkDisplay não encontrado no DOM!');
  }
});

joinRoomBtn.onclick = () => {
  const code = roomCodeInput.value.trim().toUpperCase();
  console.log('Tentando entrar na sala com código:', code);
  if (code.length === 6) {
    socket.emit('joinRoom', { code });
    createRoomBtn.disabled = true;
    joinRoomBtn.disabled = true;
    startBtn.disabled = true;
    statusDiv.textContent = t('trying_to_join_room');
    
    // Ocultar footer quando tentando entrar em sala
    const footer = document.querySelector('footer');
    if (footer) footer.style.display = 'none';
  } else {
    statusDiv.textContent = t('enter_6_char_code');
  }
};

socket.on('roomError', ({ message }) => {
  console.log('Erro ao entrar/criar sala:', message);
  statusDiv.textContent = message;
  createRoomBtn.disabled = false;
  joinRoomBtn.disabled = false;
  startBtn.disabled = false;
  roomCodeDisplay.style.display = 'none';
  
  // Mostrar footer novamente em caso de erro
  showFooter();
});

socket.on('gameStart', (data) => {
  myColor = data.color;
  roomId = data.roomId;
  statusDiv.textContent = t('playing_with', { color: myColor === 'white' ? t('white_pieces') : t('black_pieces') });
  startBtn.style.display = 'none';
  game = new Chess();
  board = Chessboard('chessboard', {
    draggable: true,
    position: 'start',
    orientation: myColor,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: 'img/chesspieces/wikipedia/{piece}.svg',
    width: Math.min(window.innerWidth, window.innerHeight) * 0.9
  });
  updateStatus();
  whiteSeconds = 0;
  blackSeconds = 0;
  whiteTimerSpan.textContent = '0:00';
  blackTimerSpan.textContent = '0:00';
  stopTimers(); // Garante que não há timer rodando
  updateHistoryAndStats();
  showGameInfo(true);
  resignBtn.style.display = '';
  resignBtn.disabled = false;
  privateRoomControls.style.display = 'none';
  roomCodeDisplay.style.display = 'none';
  myChatName = data.myChatName;
  opponentChatName = data.opponentChatName;
  chatMessages.innerHTML = '';
  showVictoryOverlay(false);
  timersDiv.style.display = '';
  sessionStorage.setItem('privatechess_room', data.roomId);
  sessionStorage.setItem('privatechess_color', data.color);
  
  // Reset anti-cheat for new game
  antiCheat.reset();
  moveStartTime = null;
  
  // Remove any existing fair play warnings
  const existingWarning = document.getElementById('fair-play-warning');
  if (existingWarning) {
    existingWarning.remove();
  }
  
  // Ocultar footer durante o jogo
  const footer = document.querySelector('footer');
  if (footer) footer.style.display = 'none';
});

socket.on('move', (data) => {
  if (game) {
    game.move({ from: data.from, to: data.to, promotion: data.promotion || 'q' });
    board.position(game.fen());
    updateStatus();
    updateTimers();
    updateHistoryAndStats();
  }
});

// --- SONS ---
const moveSound = new Audio('sounds/move.mp3');
const winSound = new Audio('sounds/win.mp3');
const loseSound = new Audio('sounds/lose.mp3');
moveSound.preload = 'auto';
winSound.preload = 'auto';
loseSound.preload = 'auto';

function playMoveSound() {
  moveSound.currentTime = 0;
  moveSound.play();
}
function playWinSound() {
  winSound.currentTime = 0;
  winSound.play();
}
function playLoseSound() {
  loseSound.currentTime = 0;
  loseSound.play();
}

socket.on('gameOver', (data) => {
  statusDiv.textContent = t('game_over');
  stopTimers();
  updateHistoryAndStats();
  showGameInfo(false);
  resignBtn.style.display = 'none';
  if (game && !game.in_draw()) {
    const winnerColor = game.turn() === 'w' ? 'black' : 'white';
    if (winnerColor === myColor) {
      showVictoryOverlay(true, t('victory'));
      playWinSound();
    } else {
      playLoseSound();
    }
  }
  timersDiv.style.display = 'none';
  clearRoomSession();
  showFooter(); // Mostrar footer novamente
});

socket.on('opponentLeft', () => {
  statusDiv.textContent = t('opponent_left');
  startBtn.style.display = '';
  startBtn.disabled = false;
  stopTimers();
  showGameInfo(false);
  showVictoryOverlay(true, t('victory'));
  resignBtn.style.display = 'none';
  timersDiv.style.display = 'none';
  clearRoomSession();
  showFooter(); // Mostrar footer novamente
});

socket.on('opponentDisconnected', ({ timeout }) => {
  statusDiv.textContent = t('opponent_disconnected');
  let remaining = timeout;
  showGameInfo(false);
  stopTimers();
  resignBtn.style.display = 'none';
  timersDiv.style.display = 'none';
  let waitingTimer = document.createElement('div');
  waitingTimer.id = 'waiting-timer';
  waitingTimer.style.fontSize = '1.3em';
  waitingTimer.style.margin = '18px 0 0 0';
  waitingTimer.style.color = '#e53935';
  waitingTimer.textContent = `${t('waiting_victory')} ${remaining}s`;
  statusDiv.appendChild(waitingTimer);
  let interval = setInterval(() => {
    remaining--;
    if (waitingTimer) waitingTimer.textContent = `${t('waiting_victory')} ${remaining}s`;
    if (remaining <= 0) {
      clearInterval(interval);
      if (waitingTimer && waitingTimer.parentNode) waitingTimer.parentNode.removeChild(waitingTimer);
    }
  }, 1000);
  // Guardar para limpar depois
  window._waitingReconnectInterval = interval;
  window._waitingReconnectDiv = waitingTimer;
  
  // Manter footer oculto durante desconexão (jogo ainda está ativo)
});

socket.on('opponentReconnected', () => {
  statusDiv.textContent = t('opponent_reconnected');
  if (window._waitingReconnectInterval) clearInterval(window._waitingReconnectInterval);
  if (window._waitingReconnectDiv && window._waitingReconnectDiv.parentNode) window._waitingReconnectDiv.parentNode.removeChild(window._waitingReconnectDiv);
  setTimeout(() => {
    updateStatus();
    showGameInfo(true);
    timersDiv.style.display = '';
    resignBtn.style.display = '';
    
    // Ocultar footer novamente quando o jogo recomeça
    const footer = document.querySelector('footer');
    if (footer) footer.style.display = 'none';
  }, 1200);
});

socket.on('resigned', (data) => {
  if (data.winner === myColor) {
    statusDiv.textContent = t('opponent_resigned');
    showVictoryOverlay(true, t('victory'));
    playWinSound();
  } else {
    statusDiv.textContent = t('you_resigned');
    playLoseSound();
  }
  stopTimers();
  resignBtn.style.display = 'none';
  showGameInfo(false);
  timersDiv.style.display = 'none';
  clearRoomSession();
  showFooter(); // Mostrar footer novamente
});

// Add anti-cheat event handlers
socket.on('suspiciousActivityReport', (data) => {
  console.warn('Server reported suspicious activity:', data);
  
  if (data.severity === 'HIGH') {
    statusDiv.textContent = t('fair_play_warning') || 'Fair play warning: Suspicious activity detected';
    statusDiv.style.color = '#ff6b6b';
    
    // Reset color after 5 seconds
    setTimeout(() => {
      statusDiv.style.color = '';
      updateStatus();
    }, 5000);
  }
});

socket.on('fairPlayViolation', (data) => {
  console.warn('Fair play violation detected:', data);
  statusDiv.textContent = t('fair_play_violation') || 'Fair play violation detected';
  statusDiv.style.color = '#ff4757';
  
  // Show persistent warning
  const warningDiv = document.createElement('div');
  warningDiv.id = 'fair-play-warning';
  warningDiv.style.cssText = `
    background: #ff4757;
    color: white;
    padding: 10px;
    margin: 10px 0;
    border-radius: 5px;
    text-align: center;
    font-weight: bold;
  `;
  warningDiv.textContent = t('anti_cheat_detected') || 'Anti-cheat system detected suspicious activity';
  
  const gameArea = document.getElementById('game-area');
  if (gameArea) {
    gameArea.insertBefore(warningDiv, gameArea.firstChild);
  }
});

resignBtn.onclick = () => {
  console.log('Botão desistir clicado, roomId:', roomId);
  if (roomId) {
    socket.emit('resign', { roomId });
    resignBtn.disabled = true;
  }
};

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
    
    if (socket) {
      socket.emit('suspiciousActivity', {
        type: type,
        data: data,
        playerStats: this.playerStats
      });
    }
    
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

function onDragStart(source, piece, position, orientation) {
  if (game.game_over() || 
      (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
  
  // Start timing the move
  moveStartTime = Date.now();
  
  // Highlight possible moves
  const moves = game.moves({ square: source });
  moves.forEach(move => {
    const target = move.slice(-2);
    animateMoveHighlight(target);
  });
}

// Animação ao mover peça: highlight animado
function animateMoveHighlight(square) {
  const boardDiv = document.getElementById('chessboard');
  if (!boardDiv) return;
  const highlight = document.createElement('div');
  highlight.className = 'move-highlight animate__animated animate__flash';
  highlight.style.position = 'absolute';
  highlight.style.pointerEvents = 'none';
  highlight.style.zIndex = 10;
  // Precisa calcular a posição do quadrado na board (ajustar para chessboard.js)
  // Aqui é um exemplo genérico, ajuste conforme necessário:
  // highlight.style.left = ...; highlight.style.top = ...;
  boardDiv.appendChild(highlight);
  setTimeout(() => boardDiv.removeChild(highlight), 700);
}

// Modificar onDrop para animar highlight
function onDrop(source, target) {
  // Só permite mover se for a vez do jogador
  const turn = game.turn();
  if ((turn === 'w' && myColor !== 'white') || (turn === 'b' && myColor !== 'black')) {
    return 'snapback';
  }

  // Tenta o movimento localmente só para validar
  const move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  });

  if (move === null) return 'snapback';

  // Desfaz o movimento local (será feito pelo servidor)
  game.undo();

  // Envia para o backend
  socket.emit('move', {
    roomId,
    from: source,
    to: target,
    promotion: 'q'
  });

  // Analisa tempo e anti-cheat
  if (moveStartTime) {
    const moveTime = Date.now() - moveStartTime;
    antiCheat.analyzeMove(move.san, game.fen(), moveTime);
    moveStartTime = null;
  }

  // Não atualiza o tabuleiro aqui, só quando receber do servidor
}

function onSnapEnd() {
  if (game) board.position(game.fen());
}

function updateStatus() {
  if (!game) return;
  let status = '';
  let moveColor = game.turn() === 'w' ? t('white_time').replace(':','') : t('black_time').replace(':','');
  if (game.in_checkmate()) {
    status = t('checkmate', { winner: game.turn() === 'w' ? t('black_time').replace(':','') : t('white_time').replace(':','') });
  } else if (game.in_draw()) {
    status = t('draw');
  } else {
    status = t('turn', { color: moveColor }) + (game.in_check() ? t('check') : '');
  }
  statusDiv.textContent = status;
  statusDiv.classList.add('animate__animated', 'animate__fadeIn');
  setTimeout(() => statusDiv.classList.remove('animate__animated', 'animate__fadeIn'), 700);

  // Bloquear/desbloquear tabuleiro conforme a vez
  if (board) {
    const turn = game.turn();
    const isMyTurn = (turn === 'w' && myColor === 'white') || (turn === 'b' && myColor === 'black');
    board.draggable = isMyTurn;
    // Para chessboard.js, precisamos destruir e recriar o tabuleiro para mudar o draggable
    if (typeof board.destroy === 'function') {
      const fen = game.fen();
      board.destroy();
      board = Chessboard('chessboard', {
        draggable: isMyTurn,
        position: fen,
        orientation: myColor,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: 'img/chesspieces/wikipedia/{piece}.svg',
        width: Math.min(window.innerWidth, window.innerHeight) * 0.9
      });
    }
  }
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function startWhiteTimer() {
  clearInterval(whiteInterval);
  whiteInterval = setInterval(() => {
    whiteSeconds++;
    whiteTimerSpan.textContent = formatTime(whiteSeconds);
  }, 1000);
}

function startBlackTimer() {
  clearInterval(blackInterval);
  blackInterval = setInterval(() => {
    blackSeconds++;
    blackTimerSpan.textContent = formatTime(blackSeconds);
  }, 1000);
}

function stopTimers() {
  clearInterval(whiteInterval);
  clearInterval(blackInterval);
}

function updateTimers() {
  if (!game) return;
  if (game.turn() === 'w') {
    startWhiteTimer();
    clearInterval(blackInterval);
  } else {
    startBlackTimer();
    clearInterval(whiteInterval);
  }
}

function updateHistoryAndStats() {
  if (!game) return;
  // Atualiza histórico de movimentos
  const history = game.history({ verbose: true });
  moveList.innerHTML = '';
  let captures = 0;
  let checks = 0;
  game.history().forEach((move, idx) => {
    const li = document.createElement('li');
    li.textContent = move;
    li.className = 'animate__animated animate__fadeIn';
    moveList.appendChild(li);
  });
  moveCountSpan.textContent = history.length;
  captureCountSpan.textContent = captures;
  checkCountSpan.textContent = checks;
}

function showGameInfo(show) {
  historyDiv.style.display = show ? '' : 'none';
  statsDiv.style.display = show ? '' : 'none';
  chatDiv.style.display = show ? '' : 'none';
}

function showVictoryOverlay(show, msg) {
  if (show) {
    victoryOverlay.style.display = 'flex';
    victoryOverlay.classList.add('animate__animated', 'animate__fadeIn');
    const img = victoryOverlay.querySelector('img');
    if (img) img.classList.add('animate__animated', 'animate__bounce');
    if (msg) victoryOverlay.querySelector('div').textContent = msg;
  } else {
    victoryOverlay.style.display = 'none';
    victoryOverlay.classList.remove('animate__animated', 'animate__fadeIn');
    const img = victoryOverlay.querySelector('img');
    if (img) img.classList.remove('animate__animated', 'animate__bounce');
  }
}
showVictoryOverlay(false);

showGameInfo(false); // Esconde ao carregar 

function addChatMessage({ name, text, type, senderId }) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'chat-message animate__animated animate__fadeIn';
  // Definir classe e estrela para jogadores
  if (type === 'player') {
    if (name === myChatName) {
      msgDiv.classList.add('player1');
    } else {
      msgDiv.classList.add('player2');
    }
    const star = document.createElement('span');
    star.className = 'star';
    star.textContent = '⭐';
    msgDiv.appendChild(star);
  } else {
    msgDiv.classList.add('spectator');
  }
  const nameSpan = document.createElement('span');
  nameSpan.textContent = name + ': ';
  msgDiv.appendChild(nameSpan);
  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  msgDiv.appendChild(textSpan);
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.onsubmit = (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (text && myChatName) {
    socket.emit('chatMessage', { roomId, text });
    chatInput.value = '';
  }
};

socket.on('chatMessage', ({ name, text, type, senderId }) => {
  addChatMessage({ name, text, type, senderId });
}); 

function getRandomFilename() {
  const rand = Math.floor(10000000 + Math.random() * 90000000);
  return `privatechess_${rand}.png`;
}

// Animação de entrada/saída para modais
function showExportModal(content, isImage, filename) {
  exportModal.style.display = 'flex';
  exportModal.classList.add('animate__animated', 'animate__fadeInDown');
  exportContent.innerHTML = '';
  downloadExportBtn.style.display = isImage || filename ? '' : 'none';
  if (isImage) {
    exportContent.appendChild(content);
    lastSnapshotCanvas = content;
    downloadExportBtn.onclick = function() {
      const link = document.createElement('a');
      link.href = content.toDataURL('image/png');
      link.download = getRandomFilename();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (lastSnapshotCanvas && lastSnapshotCanvas.parentNode) {
        lastSnapshotCanvas.parentNode.removeChild(lastSnapshotCanvas);
      }
      lastSnapshotCanvas = null;
      closeExportModal();
    };
    copyExportBtn.style.display = 'none';
  }
}
window.closeExportModal = function() {
  exportModal.classList.remove('animate__fadeInDown');
  exportModal.classList.add('animate__fadeOutUp');
  setTimeout(() => {
    exportModal.style.display = 'none';
    exportModal.classList.remove('animate__animated', 'animate__fadeOutUp');
  }, 600);
};

window.copyExportText = function() {
  const textarea = exportContent.querySelector('textarea');
  if (textarea) {
    textarea.select();
    document.execCommand('copy');
  }
};

snapshotBtn.onclick = () => {
  const boardDiv = document.getElementById('chessboard');
  html2canvas(boardDiv).then(canvas => {
    // Adicionar marca d'água pequena
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 2;
    ctx.fillText('Private CHESS', canvas.width - 8, canvas.height - 4);
    ctx.restore();
    // Criar container para imagem e lista de movimentos
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.appendChild(canvas);
    if (game) {
      const movesDiv = document.createElement('div');
      movesDiv.style.marginTop = '16px';
      movesDiv.style.background = '#181818';
      movesDiv.style.color = '#fff';
      movesDiv.style.padding = '10px 16px';
      movesDiv.style.borderRadius = '8px';
      movesDiv.style.maxWidth = '90vw';
      movesDiv.style.fontSize = '1em';
      movesDiv.innerHTML = '<b>' + t('moves') + ':</b><br>' + game.history().map((m, i) => ((i%2===0?((i/2)+1)+'. ':'')+m)).join(' ');
      container.appendChild(movesDiv);
    }
    showExportModal(container, true, 'tabuleiro.png');
  });
}; 

// Reconexão automática ao recarregar
window.addEventListener('load', () => {
  const savedRoom = sessionStorage.getItem('privatechess_room');
  const savedColor = sessionStorage.getItem('privatechess_color');
  if (savedRoom && savedColor) {
    socket.emit('reconnectToRoom', { roomId: savedRoom, color: savedColor });
  }
});
// Salvar roomId e cor ao entrar no jogo
socket.on('gameStart', (data) => {
  // ... código existente ...
  sessionStorage.setItem('privatechess_room', data.roomId);
  sessionStorage.setItem('privatechess_color', data.color);
});
// Função para mostrar o footer
function showFooter() {
  const footer = document.querySelector('footer');
  if (footer) footer.style.display = '';
}

// Limpar ao fim do jogo
function clearRoomSession() {
  sessionStorage.removeItem('privatechess_room');
  sessionStorage.removeItem('privatechess_color');
  showFooter(); // Mostrar footer novamente
}
socket.on('resigned', clearRoomSession);
socket.on('gameOver', clearRoomSession);
socket.on('opponentLeft', clearRoomSession()); 

let translations = {};
let currentLang = localStorage.getItem('privatechess_lang') || 'pt';

function t(key, vars) {
  let str = translations[key] || key;
  if (vars) {
    Object.keys(vars).forEach(k => {
      str = str.replace(`{${k}}`, vars[k]);
    });
  }
  return str;
}

function applyTranslations() {
  document.title = t('title');
  var el;
  el = document.getElementById('privacy-banner'); if (el) el.textContent = t('privacy_banner');
  el = document.getElementById('createRoomBtn'); if (el) el.textContent = t('create_room');
  el = document.getElementById('joinRoomBtn'); if (el) el.textContent = t('join_room');
  el = document.getElementById('roomCodeInput'); if (el) el.placeholder = t('room_code_placeholder');
  el = document.getElementById('startBtn'); if (el) el.textContent = t('start_game');
  el = document.getElementById('resignBtn'); if (el) el.textContent = t('resign');
  el = document.querySelector('#history h3'); if (el) el.textContent = t('move_history');
  el = document.getElementById('snapshotBtn'); if (el) el.textContent = t('download_png');
  el = document.querySelector('#stats h3'); if (el) el.textContent = t('stats');
  el = document.getElementById('move-count'); if (el && el.previousSibling) el.previousSibling.textContent = t('moves') + ' ';
  el = document.getElementById('capture-count'); if (el && el.previousSibling) el.previousSibling.textContent = t('captures') + ' ';
  el = document.getElementById('check-count'); if (el && el.previousSibling) el.previousSibling.textContent = t('checks') + ' ';
  el = document.querySelector('#chat h3'); if (el) el.textContent = t('chat');
  el = document.querySelector('#chat-form button'); if (el) el.textContent = t('send');
  // Removido: opções do seletor de idioma
  el = document.getElementById('copyright-text'); if (el) el.innerHTML = t('copyright', { year: new Date().getFullYear() });

}

function loadLang(lang) {
  fetch(`lang_${lang}.json`)
    .then(r => r.json())
    .then(data => {
      translations = data;
      currentLang = lang;
      localStorage.setItem('privatechess_lang', lang);
      // Removido: document.getElementById('lang-select').value = lang;
      applyTranslations();
      
      // Update SEO for the selected language
      if (window.updateSEO) {
        window.updateSEO(lang);
      }
    });
}

function detectBrowserLanguage() {
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && ['pt', 'en', 'ru'].includes(urlLang)) {
    return urlLang;
  }
  
  const browserLang = navigator.language || navigator.userLanguage;
  const supportedLangs = ['pt', 'en', 'ru'];
  
  // Check for exact match
  if (supportedLangs.includes(browserLang)) {
    return browserLang;
  }
  
  // Check for language prefix
  const langPrefix = browserLang.split('-')[0];
  if (supportedLangs.includes(langPrefix)) {
    return langPrefix;
  }
  
  // Default to Portuguese
  return 'pt';
}

// Remover a janela de seleção de idioma e implementar detecção automática
window.addEventListener('DOMContentLoaded', () => {
  const langModal = document.getElementById('language-modal');
  let chosenLang = localStorage.getItem('privatechess_lang');
  
  if (!chosenLang) {
    // Auto-detect browser language
    chosenLang = detectBrowserLanguage();
    localStorage.setItem('privatechess_lang', chosenLang);
  }
  
  // Load the language
  loadLang(chosenLang);
  
  // Hide language modal immediately - no user interaction needed
  if (langModal) {
    langModal.style.display = 'none';
  }
  document.body.style.overflow = '';
  
  // Remove language selection buttons since we're auto-detecting
  const flagBtns = document.querySelectorAll('.lang-flag-btn');
  flagBtns.forEach(btn => {
    btn.onclick = () => {
      const lang = btn.getAttribute('data-lang');
      localStorage.setItem('privatechess_lang', lang);
      loadLang(lang);
      if (langModal) {
        langModal.style.display = 'none';
      }
      document.body.style.overflow = '';
      
      // Update URL with language parameter
      const url = new URL(window.location);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url);
    };
  });
});

// Atualizar manifesto ao trocar idioma
const originalLoadLang = loadLang;
loadLang = function(lang) {
  originalLoadLang(lang);
  if (manifestoContainer.style.display !== 'none') {
    manifestoTitle.textContent = t('manifesto_title');
    manifestoText.textContent = t('manifesto_text');
  }
  localStorage.setItem('privatechess_lang', lang);
};

// Carregar idioma inicial
// Remover chamada automática de loadLang(currentLang) no final do arquivo

// Ajuste para evitar barras de rolagem desnecessárias
// Garante que body e html ocupem 100% e não tenham overflow
const style = document.createElement('style');
style.innerHTML = `
  html, body { height: 100%; margin: 0; padding: 0; overflow-x: hidden; }
  #game-area { flex-wrap: wrap; }
  @media (max-width: 700px) {
    #game-area { flex-direction: column; align-items: center; gap: 0; }
    #chessboard { width: 98vw; max-width: 98vw; }
    #timers { font-size: 1em; }
    #history, #stats, #chat { max-width: 98vw; min-width: unset; }
    #chat-messages { height: 80px; font-size: 0.95em; }
  }
`;
document.head.appendChild(style);

// Ao carregar a página, se houver ?room=CODE, preencher e tentar entrar
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get('room');
  if (roomParam && roomParam.length === 6) {
    roomCodeInput.value = roomParam.toUpperCase();
    joinRoomBtn.click();
  }
});