"""
Receipt Scanner API - Accessibility-focused receipt processing
FastAPI backend with Gemini AI and MongoDB integration
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
from datetime import datetime, timezone, timedelta
import base64
from security import (
    rate_limit_check,
    validate_image_upload,
    sanitize_user_input,
    validate_receipt_data,
    get_cors_origins
)
from gemini_service import (
    extract_receipt_data,
    analyze_receipt_health,
    generate_receipt_summary_text
)
from database import (
    Database,
    create_receipt,
    get_receipt_by_id,
    get_all_receipts,
    create_or_update_user_profile,
    get_user_profile
)

app = FastAPI(
    title="Receipt Scanner API",
    description="Accessibility-first receipt processing with AI",
    version="1.0.0"
)

# Get environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# CORS middleware with environment-based origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(ENVIRONMENT),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Database lifecycle events
@app.on_event("startup")
async def startup_event():
    """Connect to MongoDB on startup"""
    await Database.connect_db()

@app.on_event("shutdown")
async def shutdown_event():
    """Close MongoDB connection on shutdown"""
    await Database.close_db()

# Models
class ReceiptItem(BaseModel):
    name: str
    price: Optional[float] = None
    category: Optional[str] = None
    allergens: List[str] = []
    health_flags: List[str] = []

class Receipt(BaseModel):
    id: Optional[str] = None
    merchant: str
    date: str
    items: List[ReceiptItem]
    total: Optional[float] = None
    return_policy_days: Optional[int] = None
    return_deadline: Optional[str] = None
    image_url: Optional[str] = None
    created_at: str = datetime.now(timezone.utc).isoformat()

class HealthInsights(BaseModel):
    allergen_alerts: List[str]
    health_score: int  # 0-100
    health_warnings: List[str]
    suggestions: List[str]
    diet_flags: Dict[str, bool]

class UserProfile(BaseModel):
    allergies: List[str] = []
    dietary_preferences: List[str] = []
    health_goals: List[str] = []

@app.get("/")
async def root():
    return {
        "message": "Receipt Scanner API - Accessibility First",
        "version": "1.0.0",
        "features": ["OCR", "Allergen Detection", "Health Analysis", "Voice Support"],
        "environment": ENVIRONMENT
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post("/api/receipts/upload")
async def upload_receipt(
    request: Request,
    file: UploadFile = File(...),
    _: None = Depends(rate_limit_check),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Upload and process receipt image using Gemini Vision API
    Returns extracted receipt data

    Rate limited to 50 requests per minute per IP
    """
    try:
        # Validate content type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read and validate image
        image_bytes = await file.read()
        validate_image_upload(image_bytes, max_size_mb=10)

        # Process receipt with Gemini Vision API
        try:
            receipt_data = await extract_receipt_data(image_bytes)
        except Exception as gemini_error:
            print(f"Gemini API error: {gemini_error}")
            raise HTTPException(
                status_code=500,
                detail=f"Gemini Vision AI failed to process receipt: {str(gemini_error)[:100]}"
            )

        # Generate accessible text summary
        text_summary = await generate_receipt_summary_text(receipt_data)

        # Add the text summary to the response
        receipt_data["text_summary"] = text_summary
        receipt_data["image_size_bytes"] = len(image_bytes)
        receipt_data["processed_at"] = datetime.now(timezone.utc).isoformat()

        # Generate a temporary ID (database save is optional)
        receipt_data["id"] = f"temp_{int(datetime.now(timezone.utc).timestamp())}"

        # Attach user id if provided
        if x_user_id:
            receipt_data["user_id"] = sanitize_user_input(x_user_id, max_length=100)

        # Try to store receipt in database
        try:
            # Ensure created_at exists
            if not receipt_data.get("created_at"):
                receipt_data["created_at"] = datetime.now(timezone.utc).isoformat()

            receipt_id = await create_receipt(receipt_data.copy())
            receipt_data["id"] = receipt_id
        except Exception as db_error:
            # Database errors are non-critical but log them
            print(f"Database save failed (non-critical): {str(db_error)[:200]}")
            pass  # Continue with temp ID

        return {
            "status": "success",
            "message": "Receipt processed successfully",
            "data": receipt_data
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error processing receipt: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to process receipt. Please try again with a clearer image."
        )

@app.post("/api/receipts/analyze")
async def analyze_receipt(
    request: Request,
    receipt: Receipt,
    _: None = Depends(rate_limit_check)
):
    """
    Analyze receipt for health insights and allergens using Gemini AI

    Rate limited to 50 requests per minute per IP
    """
    try:
        # Validate receipt data
        validate_receipt_data(receipt.dict())

        # Sanitize merchant name
        receipt.merchant = sanitize_user_input(receipt.merchant, max_length=200)

        # Sanitize item names
        for item in receipt.items:
            item.name = sanitize_user_input(item.name, max_length=200)

        # Analyze health data using Gemini
        items_dict = [item.dict() for item in receipt.items]
        health_data = await analyze_receipt_health(items_dict)
        
        insights = HealthInsights(
            allergen_alerts=health_data.get("allergen_alerts", []),
            health_score=health_data.get("health_score", 50),
            health_warnings=health_data.get("health_warnings", []),
            suggestions=health_data.get("suggestions", []),
            diet_flags=health_data.get("diet_flags", {})
        )

        return insights
    
    except Exception as e:
        print(f"Error analyzing receipt: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze receipt. Please try again."
        )

@app.get("/api/receipts")
async def get_receipts(
    request: Request,
    limit: int = 10,
    offset: int = 0,
    _: None = Depends(rate_limit_check)
):
    """
    Get all receipts with pagination

    Rate limited to 50 requests per minute per IP
    """
    # Validate pagination params
    if limit > 100:
        raise HTTPException(status_code=400, detail="Limit cannot exceed 100")
    if limit < 1:
        raise HTTPException(status_code=400, detail="Limit must be at least 1")
    if offset < 0:
        raise HTTPException(status_code=400, detail="Offset cannot be negative")

    # Fetch from MongoDB
    try:
        result = await get_all_receipts(limit=limit, offset=offset)
        return result
    except Exception as e:
        print(f"Error fetching receipts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch receipts")

@app.get("/api/receipts/{receipt_id}")
async def get_receipt(
    receipt_id: str,
    request: Request,
    _: None = Depends(rate_limit_check)
):
    """
    Get single receipt by ID

    Rate limited to 50 requests per minute per IP
    """
    # Sanitize receipt_id to prevent injection
    receipt_id = sanitize_user_input(receipt_id, max_length=50)

    # Fetch from MongoDB
    try:
        receipt = await get_receipt_by_id(receipt_id)
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")
        return receipt
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching receipt: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch receipt")

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(
    request: Request,
    _: None = Depends(rate_limit_check)
):
    """
    Get dashboard statistics for the week

    Rate limited to 50 requests per minute per IP
    """
    try:
        # Get all receipts
        all_receipts_data = await get_all_receipts(limit=1000, offset=0)
        receipts = all_receipts_data.get("receipts", [])
        total_receipts = all_receipts_data.get("total", 0)

        # Calculate statistics
        money_at_risk = 0.0
        receipts_expiring_soon = 0
        allergen_alerts_this_week = 0
        health_scores = []
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)

        for receipt in receipts:
            # Calculate money at risk (receipts expiring in next 7 days)
            if receipt.get("return_deadline"):
                try:
                    deadline = datetime.fromisoformat(receipt["return_deadline"].replace('Z', '+00:00'))
                    days_until_expiry = (deadline - now).days
                    if 0 <= days_until_expiry <= 7:
                        receipts_expiring_soon += 1
                        money_at_risk += receipt.get("total", 0)
                except:
                    pass

            # Count allergen alerts from this week
            if receipt.get("created_at"):
                try:
                    created_at = datetime.fromisoformat(receipt["created_at"].replace('Z', '+00:00'))
                    if created_at >= week_ago:
                        allergen_count = len(receipt.get("allergen_alerts", []))
                        allergen_alerts_this_week += allergen_count
                except:
                    pass

            # Collect health scores
            if receipt.get("health_score"):
                health_scores.append(receipt["health_score"])

        # Calculate average health score
        health_score_avg = int(sum(health_scores) / len(health_scores)) if health_scores else 50

        # Generate health score trend (last 7 days)
        health_score_trend = []
        if health_scores:
            # Simple trend: use last 7 scores or repeat avg if fewer
            recent_scores = health_scores[-7:] if len(health_scores) >= 7 else health_scores
            health_score_trend = recent_scores + [health_score_avg] * (7 - len(recent_scores))
        else:
            health_score_trend = [50] * 7

        return {
            "money_at_risk": round(money_at_risk, 2),
            "receipts_expiring_soon": receipts_expiring_soon,
            "total_receipts": total_receipts,
            "allergen_alerts_this_week": allergen_alerts_this_week,
            "health_score_avg": health_score_avg,
            "paper_saved_count": total_receipts,
            "health_score_trend": health_score_trend
        }
    except Exception as e:
        print(f"Error calculating dashboard stats: {e}")
        # Return default values on error
        return {
            "money_at_risk": 0,
            "receipts_expiring_soon": 0,
            "total_receipts": 0,
            "allergen_alerts_this_week": 0,
            "health_score_avg": 50,
            "paper_saved_count": 0,
            "health_score_trend": [50] * 7
        }

@app.post("/api/test-ocr")
async def test_ocr(
    request: Request,
    file: UploadFile = File(...),
    _: None = Depends(rate_limit_check)
):
    """
    Test OCR extraction without using Gemini API
    Returns raw OCR text and parsed items for debugging

    Rate limited to 50 requests per minute per IP
    """
    try:
        from gemini_service import extract_text_from_image
        import re

        # Validate content type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read and validate image
        image_bytes = await file.read()
        validate_image_upload(image_bytes, max_size_mb=10)

        # Extract text using OCR only
        ocr_text = extract_text_from_image(image_bytes)

        # Try to extract basic info for debugging
        lines = ocr_text.split('\n')

        # Extract merchant
        merchant = "Not found"
        merchant_patterns = {
            "McDonald's": r"mcdonald",
            "Walmart": r"walmart",
            "Target": r"target",
            "IKEA": r"ikea",
            "Starbucks": r"starbucks",
            "Tim Hortons": r"tim\s*horton",
        }
        for name, pattern in merchant_patterns.items():
            if re.search(pattern, ocr_text, re.IGNORECASE):
                merchant = name
                break

        # Extract date
        date_match = re.search(r'(\d{2}/\d{2}/\d{4})', ocr_text)
        date_str = date_match.group(1) if date_match else "Not found"

        # Extract items
        items_found = []
        for line in lines:
            price_match = re.search(r'\b(\d{1,2}\.\d{2})\b', line)
            if price_match:
                price = float(price_match.group(1))
                if 0.01 <= price <= 50:  # Reasonable price range
                    item_name = line[:price_match.start()].strip()
                    item_name = re.sub(r'^\d+\s+', '', item_name)  # Remove quantity
                    if len(item_name) >= 3:
                        items_found.append({
                            "name": item_name,
                            "price": price
                        })

        return {
            "status": "success",
            "ocr_text": ocr_text,
            "ocr_text_length": len(ocr_text),
            "extracted_info": {
                "merchant": merchant,
                "date": date_str,
                "items_count": len(items_found),
                "items": items_found[:10]  # First 10 items
            }
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error in OCR test: {e}")
        raise HTTPException(status_code=500, detail=f"OCR test failed: {str(e)}")

@app.post("/api/text-to-speech")
async def text_to_speech(
    text: str,
    request: Request,
    _: None = Depends(rate_limit_check)
):
    """
    Convert text to speech for accessibility

    Rate limited to 50 requests per minute per IP
    """
    # Sanitize and validate input
    text = sanitize_user_input(text, max_length=5000)

    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # TODO: Integrate ElevenLabs API or Web Speech API
    return {"audio_url": "placeholder", "text_length": len(text)}

@app.post("/api/user/profile")
async def update_user_profile(
    profile: UserProfile,
    request: Request,
    _: None = Depends(rate_limit_check),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Update user allergen and dietary preferences

    Rate limited to 50 requests per minute per IP
    """
    try:
        # Sanitize profile data
        profile.allergies = [sanitize_user_input(a, 50) for a in profile.allergies[:20]]
        profile.dietary_preferences = [sanitize_user_input(d, 50) for d in profile.dietary_preferences[:20]]
        profile.health_goals = [sanitize_user_input(g, 100) for g in profile.health_goals[:10]]

        # Determine user_id (from header or default)
        user_id = sanitize_user_input(x_user_id, max_length=100) if x_user_id else "default_user"
        profile_data = profile.dict()
        profile_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        await create_or_update_user_profile(user_id, profile_data)

        return {"status": "updated", "profile": profile}
    except Exception as e:
        print(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")


@app.get("/api/users/{user_id}/receipts")
async def get_user_receipts(
    user_id: str,
    request: Request,
    limit: int = 20,
    offset: int = 0,
    _: None = Depends(rate_limit_check)
):
    """
    Get receipts for a specific user with pagination
    """
    try:
        user_id = sanitize_user_input(user_id, max_length=100)
        if limit > 100:
            raise HTTPException(status_code=400, detail="Limit cannot exceed 100")
        result = await get_all_receipts(limit=limit, offset=offset, user_id=user_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user receipts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user receipts")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
