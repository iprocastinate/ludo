// Initialize Telegram Web App SDK
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Setup User Info
const userInfoSpan = document.getElementById('user-info');
const userAvatar = document.getElementById('user-avatar');
let userId = Math.floor(Math.random() * 10000);
let userName = 'Guest';

if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    userId = user.id;
    userName = user.first_name;
    userInfoSpan.innerText = userName;
    if (user.photo_url) userAvatar.src = user.photo_url;
}

// --- UI Logic ---
let selectedMode = null;
const modeBtns = document.querySelectorAll('.mode-btn');
const findMatchBtn = document.getElementById('find-match-btn');
const queueStatus = document.getElementById('queue-status');
const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const matchIdDisplay = document.getElementById('match-id-display');

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedMode = btn.getAttribute('data-mode');
        findMatchBtn.disabled = false;
        tg.HapticFeedback.selectionChanged();
    });
});

// --- ADVANCED CANVAS BOARD (15x15 Grid) ---
const canvas = document.getElementById('ludo-board');
const ctx = canvas.getContext('2d');
const cellSize = canvas.width / 15; // 360 / 15 = 24px per cell

const colors = {
    red: '#ef4444', green: '#22c55e',
    yellow: '#eab308', blue: '#3b82f6',
    border: '#cbd5e1', bg: '#f8fafc',
    safe: '#94a3b8'
};

function drawBoard() {
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;

    // Draw the 15x15 Grid
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
    }

    // Draw 4 Large Home Bases (6x6 cells each)
    const baseSize = 6 * cellSize;
    ctx.fillStyle = colors.red; ctx.fillRect(0, 0, baseSize, baseSize); // Top-Left
    ctx.fillStyle = colors.green; ctx.fillRect(9 * cellSize, 0, baseSize, baseSize); // Top-Right
    ctx.fillStyle = colors.yellow; ctx.fillRect(0, 9 * cellSize, baseSize, baseSize); // Bottom-Left
    ctx.fillStyle = colors.blue; ctx.fillRect(9 * cellSize, 9 * cellSize, baseSize, baseSize); // Bottom-Right

    // Draw Inner White Boxes inside Home Bases
    ctx.fillStyle = colors.bg;
    ctx.fillRect(cellSize, cellSize, 4 * cellSize, 4 * cellSize);
    ctx.fillRect(10 * cellSize, cellSize, 4 * cellSize, 4 * cellSize);
    ctx.fillRect(cellSize, 10 * cellSize, 4 * cellSize, 4 * cellSize);
    ctx.fillRect(10 * cellSize, 10 * cellSize, 4 * cellSize, 4 * cellSize);

    // Draw Colored Starting Tracks & Home Columns
    for (let i = 1; i < 6; i++) {
        ctx.fillStyle = colors.red; ctx.fillRect(i * cellSize, 7 * cellSize, cellSize, cellSize); // Red Home Col
        ctx.fillStyle = colors.green; ctx.fillRect(7 * cellSize, i * cellSize, cellSize, cellSize); // Green Home Col
        ctx.fillStyle = colors.yellow; ctx.fillRect(7 * cellSize, (14 - i) * cellSize, cellSize, cellSize); // Yellow Home Col
        ctx.fillStyle = colors.blue; ctx.fillRect((14 - i) * cellSize, 7 * cellSize, cellSize, cellSize); // Blue Home Col
    }

    // Starting square colors
    ctx.fillStyle = colors.red; ctx.fillRect(cellSize, 6 * cellSize, cellSize, cellSize);
    ctx.fillStyle = colors.green; ctx.fillRect(8 * cellSize, cellSize, cellSize, cellSize);
    ctx.fillStyle = colors.yellow; ctx.fillRect(6 * cellSize, 13 * cellSize, cellSize, cellSize);
    ctx.fillStyle = colors.blue; ctx.fillRect(13 * cellSize, 8 * cellSize, cellSize, cellSize);

    // Center Triangle Box
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(6 * cellSize, 6 * cellSize, 3 * cellSize, 3 * cellSize);
}
drawBoard();

// --- WebSocket Logic ---
const BACKEND_URL = 'https://ludo-m03g.onrender.com'; // CHANGE THIS
const socket = io(BACKEND_URL); 
let currentMatchId = null;
const diceBtn = document.getElementById('roll-dice-btn');
const diceResult = document.getElementById('dice-result');

findMatchBtn.addEventListener('click', () => {
    if (!selectedMode) return;
    findMatchBtn.innerText = 'SEARCHING...';
    findMatchBtn.disabled = true;
    queueStatus.innerText = 'Waiting for opponent...';
    
    socket.emit('join_matchmaking', { mode: selectedMode, userId, userName });
    tg.HapticFeedback.impactOccurred('medium');
});

socket.on('match_found', (data) => {
    tg.HapticFeedback.notificationOccurred('success');
    currentMatchId = data.matchId;
    
    menuScreen.classList.remove('active');
    gameScreen.classList.add('active');
    matchIdDisplay.innerText = data.matchId.split(':')[1].substring(0,6);

    // Enable Dice if it's our turn
    if (data.startingTurn === userId) {
        diceBtn.disabled = false;
        diceBtn.innerText = 'ROLL DICE';
        diceBtn.classList.remove('disabled');
        diceBtn.classList.add('primary');
    } else {
        diceBtn.disabled = true;
        diceBtn.innerText = 'WAITING FOR OPPONENT...';
    }
});

diceBtn.addEventListener('click', () => {
    if (!currentMatchId || diceBtn.disabled) return;
    
    // Temporarily disable while rolling
    diceBtn.disabled = true;
    diceBtn.innerText = 'ROLLING...';
    socket.emit('roll_dice', { matchId: currentMatchId, userId });
});

socket.on('dice_rolled', (data) => {
    diceResult.parentElement.classList.remove('dice-anim');
    void diceResult.parentElement.offsetWidth; // Trigger reflow
    diceResult.parentElement.classList.add('dice-anim');
    diceResult.innerText = data.roll;
    
    if (data.userId === userId) {
        tg.HapticFeedback.impactOccurred('heavy');
        diceBtn.innerText = 'WAITING FOR OPPONENT...'; // In a real game, this depends on if they got a 6 or can move.
    } else {
        tg.HapticFeedback.impactOccurred('light');
        diceBtn.disabled = false;
        diceBtn.innerText = 'ROLL DICE';
        diceBtn.classList.remove('disabled');
        diceBtn.classList.add('primary');
    }
});

socket.on('error', (msg) => {
    tg.showAlert(`Error: ${msg}`);
    findMatchBtn.innerText = 'FIND MATCH';
    findMatchBtn.disabled = false;
    queueStatus.innerText = '';
});
