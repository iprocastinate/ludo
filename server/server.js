require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Serve the frontend Mini App
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// --- REDIS SETUP ---
const redisMatchmaking = createClient({ url: process.env.REDIS_URI_2 || 'redis://localhost:6379' });
const redisGameState = createClient({ url: process.env.REDIS_URI_1 || 'redis://localhost:6379' });

redisMatchmaking.on('error', (err) => console.log('Redis Matchmaking Error', err));
redisGameState.on('error', (err) => console.log('Redis GameState Error', err));

async function initRedis() {
    await redisMatchmaking.connect();
    await redisGameState.connect();
    console.log('Connected to Multi-Redis.');
}
initRedis();

// --- MATCHMAKING LOGIC ---
const REQUIRED_PLAYERS = {
    'ffa_2': 2,
    'ffa_4': 4,
    'team_2v2': 4
};

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Join Matchmaking Queue
    socket.on('join_matchmaking', async (data) => {
        const { mode, userId, userName } = data; // e.g., mode: 'ffa_2'
        
        if (!REQUIRED_PLAYERS[mode]) {
            return socket.emit('error', 'Invalid game mode');
        }

        const queueKey = `queue:${mode}`;
        
        // Add player to Redis List
        await redisMatchmaking.rPush(queueKey, JSON.stringify({ socketId: socket.id, userId, userName }));
        socket.emit('matchmaking_status', { status: 'searching', queue: mode });

        // Check if queue has enough players to start a match
        const queueLength = await redisMatchmaking.lLen(queueKey);
        
        if (queueLength >= REQUIRED_PLAYERS[mode]) {
            // Pop players from queue
            const players = [];
            for (let i = 0; i < REQUIRED_PLAYERS[mode]; i++) {
                const p = await redisMatchmaking.lPop(queueKey);
                players.push(JSON.parse(p));
            }
            
            // Create Match
            const matchId = `match:${Date.now()}`;
            
            // Initialize game state in Redis GameState DB
            const initialState = {
                turn: players[0].userId, // First player starts
                status: 'playing',
                players: players
            };
            await redisGameState.set(matchId, JSON.stringify(initialState));

            // Move players to the Socket.io room and notify them
            players.forEach(p => {
                const playerSocket = io.sockets.sockets.get(p.socketId);
                if (playerSocket) {
                    playerSocket.join(matchId);
                    playerSocket.emit('match_found', { matchId, players, startingTurn: players[0].userId });
                }
            });
            console.log(`Match ${matchId} started for mode ${mode}`);
        }
    });

    // In-Game Logic
    socket.on('roll_dice', async (data) => {
        const { matchId, userId } = data;
        
        // Verify it's this player's turn (simplified)
        const matchData = await redisGameState.get(matchId);
        if (!matchData) return socket.emit('error', 'Match not found');
        
        const state = JSON.parse(matchData);
        if (state.turn !== userId) {
            return socket.emit('error', 'Not your turn!');
        }

        const roll = Math.floor(Math.random() * 6) + 1;
        
        // Broadcast the roll to everyone in the match room
        io.to(matchId).emit('dice_rolled', { userId, roll });
        
        // TODO: Next step is updating the state with pawn movement logic
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        // TODO: Handle removing player from queues or handling mid-game disconnects
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Ludo Game Server running on port ${PORT}`);
});
