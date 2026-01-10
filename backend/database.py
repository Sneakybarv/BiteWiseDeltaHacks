"""
MongoDB Atlas database configuration and operations
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db = None

    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB Atlas"""
        cls.client = AsyncIOMotorClient(
            MONGODB_URI,
            server_api=ServerApi('1'),
            tlsAllowInvalidCertificates=True  # For development only
        )
        cls.db = cls.client.receipt_scanner
        print("Connected to MongoDB Atlas")

    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            print("MongoDB connection closed")

    @classmethod
    def get_db(cls):
        """Get database instance"""
        return cls.db


# Collections
async def get_receipts_collection():
    """Get receipts collection"""
    db = Database.get_db()
    if db is None:
        raise RuntimeError("Database not connected. Call Database.connect_db() first.")
    return db.receipts

async def get_users_collection():
    """Get users collection"""
    db = Database.get_db()
    if db is None:
        raise RuntimeError("Database not connected. Call Database.connect_db() first.")
    return db.users

async def get_analytics_collection():
    """Get analytics collection"""
    db = Database.get_db()
    if db is None:
        raise RuntimeError("Database not connected. Call Database.connect_db() first.")
    return db.analytics


# CRUD operations for receipts
async def create_receipt(receipt_data: dict):
    """Create new receipt in database"""
    collection = await get_receipts_collection()
    result = await collection.insert_one(receipt_data)
    return str(result.inserted_id)

async def get_receipt_by_id(receipt_id: str):
    """Get receipt by ID"""
    from bson import ObjectId
    collection = await get_receipts_collection()
    receipt = await collection.find_one({"_id": ObjectId(receipt_id)})
    if receipt:
        receipt["_id"] = str(receipt["_id"])
    return receipt

async def get_all_receipts(limit: int = 10, offset: int = 0, user_id: Optional[str] = None):
    """Get all receipts with pagination"""
    collection = await get_receipts_collection()
    query = {}
    if user_id:
        query["user_id"] = user_id

    cursor = collection.find(query).skip(offset).limit(limit).sort("created_at", -1)
    receipts = await cursor.to_list(length=limit)

    for receipt in receipts:
        receipt["_id"] = str(receipt["_id"])

    total = await collection.count_documents(query)
    return {"receipts": receipts, "total": total}

async def update_receipt(receipt_id: str, update_data: dict):
    """Update receipt"""
    from bson import ObjectId
    collection = await get_receipts_collection()
    result = await collection.update_one(
        {"_id": ObjectId(receipt_id)},
        {"$set": update_data}
    )
    return result.modified_count > 0

async def delete_receipt(receipt_id: str):
    """Delete receipt"""
    from bson import ObjectId
    collection = await get_receipts_collection()
    result = await collection.delete_one({"_id": ObjectId(receipt_id)})
    return result.deleted_count > 0


# User profile operations
async def create_or_update_user_profile(user_id: str, profile_data: dict):
    """Create or update user profile"""
    collection = await get_users_collection()
    result = await collection.update_one(
        {"user_id": user_id},
        {"$set": profile_data},
        upsert=True
    )
    return result

async def get_user_profile(user_id: str):
    """Get user profile"""
    collection = await get_users_collection()
    profile = await collection.find_one({"user_id": user_id})
    if profile:
        profile["_id"] = str(profile["_id"])
    return profile
