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

startBtn.onclick = () => {
  socket.emit('joinGame');
  startBtn.disabled = true;
  statusDiv.textContent = 'Aguardando outro jogador...';
};

socket.on('waiting', () => {
  statusDiv.textContent = 'Aguardando outro jogador...';
});

socket.on('gameStart', (data) => {
  myColor = data.color;
  roomId = data.roomId;
  statusDiv.textContent = `Você está jogando com as peças ${myColor === 'white' ? 'brancas' : 'pretas'}.`;
  startBtn.style.display = 'none';
  game = new Chess();
  board = Chessboard('chessboard', {
    draggable: true,
    position: 'start',
    orientation: myColor,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    width: Math.min(window.innerWidth, window.innerHeight) * 0.9
  });
  updateStatus();
  whiteSeconds = 0;
  blackSeconds = 0;
  whiteTimerSpan.textContent = '0:00';
  blackTimerSpan.textContent = '0:00';
  updateTimers();
  updateHistoryAndStats();
  showGameInfo(true);
  resignBtn.style.display = '';
  resignBtn.disabled = false;
  showVictoryOverlay(false);
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

socket.on('gameOver', (data) => {
  statusDiv.textContent = 'Fim de jogo!';
  stopTimers();
  updateHistoryAndStats();
  showGameInfo(false);
  resignBtn.style.display = 'none';
  if (game && !game.in_draw()) {
    // Verifica se o jogador venceu
    const winnerColor = game.turn() === 'w' ? 'black' : 'white';
    if (winnerColor === myColor) {
      showVictoryOverlay(true);
    }
  }
});

socket.on('opponentLeft', () => {
  statusDiv.textContent = 'O adversário saiu da partida.';
  startBtn.style.display = '';
  startBtn.disabled = false;
  stopTimers();
  showGameInfo(false);
  showVictoryOverlay(true);
  resignBtn.style.display = 'none';
});

socket.on('resigned', (data) => {
  if (data.winner === myColor) {
    statusDiv.textContent = 'O adversário desistiu. Você venceu!';
  } else {
    statusDiv.textContent = 'Você desistiu. Vitória do adversário!';
  }
  stopTimers();
  resignBtn.style.display = 'none';
  showGameInfo(false);
  if (data.winner === myColor) {
    showVictoryOverlay(true);
  }
});

resignBtn.onclick = () => {
  console.log('Botão desistir clicado, roomId:', roomId);
  if (roomId) {
    socket.emit('resign', { roomId });
    resignBtn.disabled = true;
  }
};

function onDragStart(source, piece, position, orientation) {
  if (!game || game.game_over()) return false;
  if ((myColor === 'white' && piece.search(/^b/) !== -1) ||
      (myColor === 'black' && piece.search(/^w/) !== -1)) {
    return false;
  }
  // Só pode mover se for seu turno
  if ((myColor === 'white' && game.turn() !== 'w') ||
      (myColor === 'black' && game.turn() !== 'b')) {
    return false;
  }
}

function onDrop(source, target) {
  if (!game) return 'snapback';
  const move = game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';
  socket.emit('move', { roomId, from: source, to: target, promotion: 'q' });
  updateStatus();
}

function onSnapEnd() {
  if (game) board.position(game.fen());
}

function updateStatus() {
  if (!game) return;
  let status = '';
  let moveColor = game.turn() === 'w' ? 'brancas' : 'pretas';
  if (game.in_checkmate()) {
    status = 'Xeque-mate! ' + (game.turn() === 'w' ? 'Pretas' : 'Brancas') + ' venceram.';
  } else if (game.in_draw()) {
    status = 'Empate!';
  } else {
    status = 'Vez das ' + moveColor + (game.in_check() ? ' (xeque!)' : '');
  }
  statusDiv.textContent = status;
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
  history.forEach((move, idx) => {
    const li = document.createElement('li');
    let moveText = `${move.from}-${move.to}`;
    if (move.captured) {
      moveText += ` (captura: ${move.captured})`;
      captures++;
    }
    if (move.san.includes('+')) {
      moveText += ' (xeque)';
      checks++;
    }
    li.textContent = moveText;
    moveList.appendChild(li);
  });
  moveCountSpan.textContent = history.length;
  captureCountSpan.textContent = captures;
  checkCountSpan.textContent = checks;
}

function showGameInfo(show) {
  historyDiv.style.display = show ? '' : 'none';
  statsDiv.style.display = show ? '' : 'none';
}

function showVictoryOverlay(show) {
  victoryOverlay.style.display = show ? 'flex' : 'none';
}
showVictoryOverlay(false);

showGameInfo(false); // Esconde ao carregar 