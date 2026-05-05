import logging
from motor.motor_asyncio import AsyncIOMotorClient
from config import Config

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        # Multi-Mongo Connection
        try:
            self.client_1 = AsyncIOMotorClient(Config.MONGO_URI_1)
            self.db_1 = self.client_1["LudoStatsDB"]
            self.profiles = self.db_1["users"]
            
            self.client_2 = AsyncIOMotorClient(Config.MONGO_URI_2)
            self.db_2 = self.client_2["LudoAdminDB"]
            self.admins = self.db_2["admins"]
            self.bans = self.db_2["bans"]
            logger.info("Successfully connected to Multi-Mongo Clusters.")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")

    # --- User Profile Methods (DB 1) ---
    async def get_user(self, user_id: int):
        user = await self.profiles.find_one({"user_id": user_id})
        if not user:
            user = {
                "user_id": user_id,
                "games_played": 0,
                "wins": 0,
                "losses": 0,
                "total_cuts": 0
            }
            await self.profiles.insert_one(user)
        return user

    async def get_top_players(self, limit=10):
        cursor = self.profiles.find().sort("wins", -1).limit(limit)
        return await cursor.to_list(length=limit)

    # --- Admin Methods (DB 2) ---
    async def is_admin(self, user_id: int) -> bool:
        if user_id == Config.OWNER_ID:
            return True
        admin = await self.admins.find_one({"user_id": user_id})
        return bool(admin)

    async def add_admin(self, user_id: int):
        await self.admins.update_one({"user_id": user_id}, {"$set": {"user_id": user_id}}, upsert=True)

    async def remove_admin(self, user_id: int):
        await self.admins.delete_one({"user_id": user_id})

    # --- Ban Methods (DB 2) ---
    async def is_banned(self, user_id: int) -> bool:
        banned = await self.bans.find_one({"user_id": user_id})
        return bool(banned)

    async def ban_user(self, user_id: int, reason: str = "No reason provided"):
        await self.bans.update_one({"user_id": user_id}, {"$set": {"user_id": user_id, "reason": reason}}, upsert=True)

    async def unban_user(self, user_id: int):
        await self.bans.delete_one({"user_id": user_id})

db = Database()
