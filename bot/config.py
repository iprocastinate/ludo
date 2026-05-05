import os

class Config:
    API_ID = int(os.environ.get("API_ID", 33998690))
    API_HASH = os.environ.get("API_HASH", "51c2f260ca99176705d2190d01630919")
    BOT_TOKEN = os.environ.get("BOT_TOKEN", "8681524394:AAFuL1mpZJabprhKnXi-9QbPhQVbhdgtJN0")
    OWNER_ID = int(os.environ.get("OWNER_ID", 7984224708))
    
    # Multi-Mongo Setup
    MONGO_URI_1 = os.environ.get("MONGO_URI_1", "mongodb+srv://pocar56750_db_user:6yhQvYWKSGJxiSMJ@cluster0.wuzknmx.mongodb.net/?retryWrites=true&w=majority")  # Profiles & Stats
    MONGO_URI_2 = os.environ.get("MONGO_URI_2", "mongodb+srv://hosaxi3364_db_user:VGB5NXxdieAuc9YX@cluster0.6o6xtd1.mongodb.net/?retryWrites=true&w=majority")  # Admins & Logs
    
    # Multi-Redis Setup (If needed on bot side)
    REDIS_URI_1 = os.environ.get("REDIS_URI_1", "redis://default:dKJuyhorvRzf1r5wHR8K9TaGZI30As0n@redis-19136.crce219.us-east-1-4.ec2.cloud.redislabs.com:19136")
    REDIS_URI_2 = os.environ.get("REDIS_URI_2", "redis://redis-16388.crce300.ap-south-1-2.ec2.cloud.redislabs.com:16388")
    
    # Web App URL
    MINI_APP_URL = os.environ.get("MINI_APP_URL", "https://ludo-silk-eta.vercel.app/")
