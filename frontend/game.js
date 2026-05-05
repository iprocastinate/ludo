// Initialize Telegram Web App SDK
const tg = window.Telegram.WebApp;
tg.expand(); // Expand to full screen

// Setup User Info
const userInfoDiv = document.getElementById('user-info');
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    userInfoDiv.innerText = `Player: ${user.first_name}`;
} else {
    userInfoDiv.innerText = `Player: Guest`;
}

// Basic Canvas Setup for Ludo Board
const canvas = document.getElementById('ludo-board');
const ctx = canvas.getContext('2d');

function drawBoard() {
    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw placeholder cross (The classic Ludo layout)
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(160, 0, 80, 400); // Vertical path
    ctx.fillRect(0, 160, 400, 80); // Horizontal path
    
    // Home bases (Red, Green, Yellow, Blue)
    const baseSize = 160;
    
    ctx.fillStyle = '#ff4d4d'; // Red (Top Left)
    ctx.fillRect(0, 0, baseSize, baseSize);
    
    ctx.fillStyle = '#4dff4d'; // Green (Top Right)
    ctx.fillRect(240, 0, baseSize, baseSize);
    
    ctx.fillStyle = '#ffff4d'; // Yellow (Bottom Left)
    ctx.fillRect(0, 240, baseSize, baseSize);
    
    ctx.fillStyle = '#4d4dff'; // Blue (Bottom Right)
    ctx.fillRect(240, 240, baseSize, baseSize);
    
    // Center Triangle
    ctx.fillStyle = '#333';
    ctx.fillRect(160, 160, 80, 80);
}

drawBoard();

// --- MULTIPLAYER WEBSOCKET LOGIC ---
// IMPORTANT: Replace this URL with your actual Render URL once deployed!
const BACKEND_URL = 'https://your-backend-project.onrender.com';
const socket = io(BACKEND_URL); 

let currentMatchId = null;

const diceBtn = document.getElementById('roll-dice-btn');
const diceResult = document.getElementById('dice-result');

// Add a Matchmaking Button dynamically
const controlsDiv = document.getElementById('controls');
const matchBtn = document.createElement('button');
matchBtn.className = 'btn';
matchBtn.innerText = 'FIND MATCH (1v1)';
controlsDiv.insertBefore(matchBtn, diceBtn);

diceBtn.style.display = 'none'; // Hide dice until match is found

matchBtn.addEventListener('click', () => {
    matchBtn.innerText = 'SEARCHING...';
    matchBtn.disabled = true;
    
    // Join Matchmaking Queue
    socket.emit('join_matchmaking', {
        mode: 'ffa_2',
        userId: tg.initDataUnsafe?.user?.id || Math.floor(Math.random() * 1000),
        userName: tg.initDataUnsafe?.user?.first_name || 'Guest'
    });
});

socket.on('match_found', (data) => {
    tg.HapticFeedback.notificationOccurred('success');
    currentMatchId = data.matchId;
    matchBtn.style.display = 'none';
    diceBtn.style.display = 'block';
    diceResult.innerText = `Match Found! Turn: ${data.startingTurn}`;
});

socket.on('dice_rolled', (data) => {
    diceResult.innerText = `Player ${data.userId} Rolled: ${data.roll}`;
    tg.HapticFeedback.impactOccurred('light');
});

socket.on('error', (msg) => {
    tg.showAlert(`Error: ${msg}`);
});

diceBtn.addEventListener('click', () => {
    if (!currentMatchId) return;
    
    socket.emit('roll_dice', {
        matchId: currentMatchId,
        userId: tg.initDataUnsafe?.user?.id || 123
    });
});
