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

// --- Canvas Board ---
const canvas = document.getElementById('ludo-board');
const ctx = canvas.getContext('2d');

function drawBoard() {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const s = 144; // Base size
    const p = 72;  // Path width
    
    // Paths
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(s, 0, p, 360);
    ctx.fillRect(0, s, 360, p);
    
    // Home Bases
    ctx.fillStyle = '#ef4444'; ctx.fillRect(0, 0, s, s); // Red
    ctx.fillStyle = '#22c55e'; ctx.fillRect(s+p, 0, s, s); // Green
    ctx.fillStyle = '#eab308'; ctx.fillRect(0, s+p, s, s); // Yellow
    ctx.fillStyle = '#3b82f6'; ctx.fillRect(s+p, s+p, s, s); // Blue
    
    // Center Home
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(s, s, p, p);
}
drawBoard();

// --- WebSocket Logic ---
const BACKEND_URL = 'https://ludo-m03g.onrender.com'; // CHANGE THIS
const socket = io(BACKEND_URL); 

let currentMatchId = null;

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
    
    // Switch Screen
    menuScreen.classList.remove('active');
    gameScreen.classList.add('active');
    matchIdDisplay.innerText = data.matchId.split(':')[1].substring(0,6); // Short ID
});

socket.on('error', (msg) => {
    tg.showAlert(`Error: ${msg}`);
    findMatchBtn.innerText = 'FIND MATCH';
    findMatchBtn.disabled = false;
    queueStatus.innerText = '';
});

// --- Game Controls ---
const diceBtn = document.getElementById('roll-dice-btn');
const diceResult = document.getElementById('dice-result');

diceBtn.addEventListener('click', () => {
    if (!currentMatchId) return;
    socket.emit('roll_dice', { matchId: currentMatchId, userId });
});

socket.on('dice_rolled', (data) => {
    // Add shake animation
    diceResult.parentElement.classList.remove('dice-anim');
    void diceResult.parentElement.offsetWidth; // Trigger reflow
    diceResult.parentElement.classList.add('dice-anim');
    
    diceResult.innerText = data.roll;
    
    if (data.userId === userId) {
        tg.HapticFeedback.impactOccurred('heavy');
    } else {
        tg.HapticFeedback.impactOccurred('light');
    }
});
