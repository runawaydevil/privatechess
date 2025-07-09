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
  roomCodeDisplay.style.display = '';
  roomCodeDisplay.textContent = t('room_code', { code: code });
  roomCodeInput.value = code;
  createRoomBtn.disabled = true;
  joinRoomBtn.disabled = true;
  startBtn.disabled = true;
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
  if (!game) return 'snapback';
  const move = game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';
  socket.emit('move', { roomId, from: source, to: target, promotion: 'q' });
  updateStatus();
  animateMoveHighlight(target); // animação ao mover
  playMoveSound();
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
  el = document.getElementById('footer-text'); if (el) el.textContent = t('footer', { year: new Date().getFullYear() });
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
    });
}

window.addEventListener('DOMContentLoaded', () => {
  const langModal = document.getElementById('language-modal');
  const flagBtns = document.querySelectorAll('.lang-flag-btn');
  let chosenLang = localStorage.getItem('privatechess_lang');
  if (!chosenLang) {
    langModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    flagBtns.forEach(btn => {
      btn.onclick = () => {
        const lang = btn.getAttribute('data-lang');
        localStorage.setItem('privatechess_lang', lang);
        loadLang(lang);
        langModal.style.display = 'none';
        document.body.style.overflow = '';
      };
    });
  } else {
    loadLang(chosenLang);
    langModal.style.display = 'none';
    document.body.style.overflow = '';
  }
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