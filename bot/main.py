import asyncio
import logging
from pyrogram import Client, filters
from pyrogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo, Message
from config import Config
from database import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Client(
    "LudoBot",
    api_id=Config.API_ID,
    api_hash=Config.API_HASH,
    bot_token=Config.BOT_TOKEN
)

# Middleware for banned users
@app.on_message(filters.all, group=-1)
async def ban_filter(client, message: Message):
    if message.from_user and await db.is_banned(message.from_user.id):
        message.stop_propagation()

@app.on_message(filters.command("start") & filters.private)
async def start_command(client, message: Message):
    user = await db.get_user(message.from_user.id)
    keyboard = InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    "🎲 Play Ludo",
                    web_app=WebAppInfo(url=Config.MINI_APP_URL)
                )
            ],
            [
                InlineKeyboardButton("📊 Leaderboard", callback_data="leaderboard"),
                InlineKeyboardButton("👤 Profile", callback_data="profile")
            ]
        ]
    )
    await message.reply_text(
        f"Hello **{message.from_user.first_name}**!\n\nWelcome to the ultimate Ludo experience.\nYou have played {user['games_played']} games.",
        reply_markup=keyboard
    )

@app.on_message(filters.command("profile"))
async def profile_command(client, message: Message):
    user = await db.get_user(message.from_user.id)
    win_rate = (user['wins'] / user['games_played'] * 100) if user['games_played'] > 0 else 0
    text = f"**👤 Profile of {message.from_user.first_name}**\n\n"
    text += f"🎮 Games Played: {user['games_played']}\n"
    text += f"🏆 Wins: {user['wins']}\n"
    text += f"💔 Losses: {user['losses']}\n"
    text += f"🔪 Total Cuts: {user['total_cuts']}\n"
    text += f"📈 Win Rate: {win_rate:.1f}%\n"
    await message.reply_text(text)

@app.on_message(filters.command("leaderboard"))
async def leaderboard_command(client, message: Message):
    top_players = await db.get_top_players(10)
    text = "**🏆 Global Ludo Leaderboard**\n\n"
    for i, player in enumerate(top_players, 1):
        text += f"{i}. `ID: {player['user_id']}` - {player['wins']} Wins\n"
    await message.reply_text(text)

# --- Admin Commands ---
@app.on_message(filters.command("addadmin") & filters.user(Config.OWNER_ID))
async def add_admin_command(client, message: Message):
    if len(message.command) < 2:
        return await message.reply_text("Usage: /addadmin <user_id>")
    target_id = int(message.command[1])
    await db.add_admin(target_id)
    await message.reply_text(f"✅ User {target_id} added as Admin.")

@app.on_message(filters.command("removeadmin") & filters.user(Config.OWNER_ID))
async def remove_admin_command(client, message: Message):
    if len(message.command) < 2:
        return await message.reply_text("Usage: /removeadmin <user_id>")
    target_id = int(message.command[1])
    await db.remove_admin(target_id)
    await message.reply_text(f"❌ User {target_id} removed from Admins.")

@app.on_message(filters.command("ban"))
async def ban_user_command(client, message: Message):
    if not await db.is_admin(message.from_user.id):
        return await message.reply_text("⛔ You are not an admin.")
    if len(message.command) < 2:
        return await message.reply_text("Usage: /ban <user_id> [reason]")
    
    target_id = int(message.command[1])
    reason = " ".join(message.command[2:]) if len(message.command) > 2 else "No reason"
    await db.ban_user(target_id, reason)
    await message.reply_text(f"🔨 User {target_id} banned. Reason: {reason}")

@app.on_message(filters.command("unban"))
async def unban_user_command(client, message: Message):
    if not await db.is_admin(message.from_user.id):
        return await message.reply_text("⛔ You are not an admin.")
    if len(message.command) < 2:
        return await message.reply_text("Usage: /unban <user_id>")
    
    target_id = int(message.command[1])
    await db.unban_user(target_id)
    await message.reply_text(f"🕊️ User {target_id} unbanned.")

if __name__ == "__main__":
    logger.info("Starting Ludo Bot...")
    app.run()
