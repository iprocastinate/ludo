import os

class Config:
    API_ID = int(os.environ.get("API_ID", 0))
    API_HASH = os.environ.get("API_HASH", "")
    BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
    OWNER_ID = int(os.environ.get("OWNER_ID", 0))
    
    # Multi-Mongo Setup
    MONGO_URI_1 = os.environ.get("MONGO_URI_1", "")  # Profiles & Stats
    MONGO_URI_2 = os.environ.get("MONGO_URI_2", "")  # Admins & Logs
    
    # Multi-Redis Setup (If needed on bot side)
    REDIS_URI_1 = os.environ.get("REDIS_URI_1", "")
    REDIS_URI_2 = os.environ.get("REDIS_URI_2", "")
    
    # Web App URL
    MINI_APP_URL = os.environ.get("MINI_APP_URL", "https://your-mini-app-url.com")
