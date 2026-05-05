#!/bin/bash

# Start the Node.js Game Server in the background
echo "Starting Game Server..."
cd server
npm install
node server.js &
cd ..

# Start the Python Telegram Bot
echo "Starting Telegram Bot..."
cd bot
python main.py
