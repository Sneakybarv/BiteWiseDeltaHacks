"""
MongoDB Atlas database configuration and operations

bash scripts/reset_and_run.sh
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv
from typing import Optional
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import hashlib

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
        logging.getLogger(__name__).info("Connected to MongoDB Atlas")

    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            logging.getLogger(__name__).info("MongoDB connection closed")

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


async def get_api_keys_collection():
    """Get api_keys collection"""
    db = Database.get_db()
    if db is None:
        raise RuntimeError("Database not connected. Call Database.connect_db() first.")
    return db.api_keys


async def create_api_key(owner: str = "owner", scope: Optional[List[str]] = None, expires_seconds: int = 60 * 60 * 24):
    """Create and store a new API key. Returns the plaintext token and the inserted id."""
    if scope is None:
        scope = ["write"]

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=expires_seconds)

    collection = await get_api_keys_collection()
    doc = {
        "owner": owner,
        "token_hash": token_hash,
        "scope": scope,
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "active": True,
    }
    result = await collection.insert_one(doc)
    return token, str(result.inserted_id)


async def get_api_key_by_hash(token_hash: str):
    collection = await get_api_keys_collection()
    key = await collection.find_one({"token_hash": token_hash})
    return key


async def validate_api_key(token: str):
    """Validate a plaintext token. Returns the key doc if valid, else None."""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    key = await get_api_key_by_hash(token_hash)
    if not key:
        return None

    if not key.get("active", True):
        return None

    try:
        expires_at = datetime.fromisoformat(key.get("expires_at"))
    except Exception:
        return None

    if expires_at < datetime.now(timezone.utc):
        return None

    return key


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
        receipt["id"] = str(receipt["_id"])
        receipt.pop("_id", None)
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
        receipt["id"] = str(receipt["_id"])
        receipt.pop("_id", None)

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
    await collection.update_one(
        {"user_id": user_id},
        {"$set": profile_data},
        upsert=True
    )

    # Return the saved profile document
    profile = await collection.find_one({"user_id": user_id})
    if profile:
        profile["id"] = str(profile.pop("_id"))
    return profile

async def get_user_profile(user_id: str):
    """Get user profile"""
    collection = await get_users_collection()
    profile = await collection.find_one({"user_id": user_id})
    if profile:
        profile["_id"] = str(profile["_id"])
    return profile
