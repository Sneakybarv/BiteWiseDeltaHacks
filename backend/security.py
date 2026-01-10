"""
Security utilities for the Receipt Scanner API
"""

from fastapi import HTTPException, Header, Request
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import time

# Simple rate limiting (in-memory for hackathon, use Redis in production)
request_counts = {}
RATE_LIMIT = 50  # requests per minute per IP
RATE_LIMIT_WINDOW = 60  # seconds


def rate_limit_check(request: Request):
    """
    Simple rate limiting to prevent API abuse
    Limits to RATE_LIMIT requests per minute per IP
    """
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()

    # Clean old entries
    for ip in list(request_counts.keys()):
        request_counts[ip] = [
            timestamp for timestamp in request_counts[ip]
            if current_time - timestamp < RATE_LIMIT_WINDOW
        ]
        if not request_counts[ip]:
            del request_counts[ip]

    # Check rate limit
    if client_ip not in request_counts:
        request_counts[client_ip] = []

    request_counts[client_ip].append(current_time)

    if len(request_counts[client_ip]) > RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Maximum {RATE_LIMIT} requests per minute."
        )


def validate_image_upload(file_bytes: bytes, max_size_mb: int = 10) -> bool:
    """
    Validate uploaded image files

    Args:
        file_bytes: Image file bytes
        max_size_mb: Maximum file size in MB

    Returns:
        True if valid, raises HTTPException otherwise
    """
    # Check file size
    file_size_mb = len(file_bytes) / (1024 * 1024)
    if file_size_mb > max_size_mb:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {max_size_mb}MB"
        )

    # Check if it's actually an image (basic check)
    try:
        from PIL import Image
        import io
        Image.open(io.BytesIO(file_bytes))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file. Please upload a valid image."
        )

    return True


def sanitize_user_input(text: str, max_length: int = 1000) -> str:
    """
    Sanitize user input to prevent injection attacks

    Args:
        text: User input text
        max_length: Maximum allowed length

    Returns:
        Sanitized text
    """
    if not text:
        return ""

    # Truncate to max length
    text = text[:max_length]

    # Remove potentially dangerous characters
    # For receipt data, we mainly care about preventing script injection
    dangerous_chars = ['<', '>', '{', '}', '`', '$']
    for char in dangerous_chars:
        text = text.replace(char, '')

    return text.strip()


def validate_receipt_data(data: dict) -> bool:
    """
    Validate receipt data to prevent malicious payloads

    Args:
        data: Receipt data dictionary

    Returns:
        True if valid, raises HTTPException otherwise
    """
    required_fields = ['merchant', 'date', 'items']

    # Check required fields
    for field in required_fields:
        if field not in data:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required field: {field}"
            )

    # Validate merchant name
    if len(data['merchant']) > 200:
        raise HTTPException(
            status_code=400,
            detail="Merchant name too long"
        )

    # Validate items
    if not isinstance(data['items'], list):
        raise HTTPException(
            status_code=400,
            detail="Items must be a list"
        )

    if len(data['items']) > 100:
        raise HTTPException(
            status_code=400,
            detail="Too many items. Maximum 100 items per receipt."
        )

    # Validate each item
    for item in data['items']:
        if not isinstance(item, dict):
            raise HTTPException(
                status_code=400,
                detail="Each item must be an object"
            )

        if 'name' not in item:
            raise HTTPException(
                status_code=400,
                detail="Each item must have a name"
            )

        if len(item['name']) > 200:
            raise HTTPException(
                status_code=400,
                detail="Item name too long"
            )

    return True


def get_cors_origins(environment: str) -> list:
    """
    Get allowed CORS origins based on environment

    Args:
        environment: "development" or "production"

    Returns:
        List of allowed origins
    """
    if environment == "production":
        return [
            "https://your-frontend-domain.vercel.app",
            # Add your actual production domains here
        ]
    else:
        return [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:3002",
        ]
