from fastapi import APIRouter, Query, HTTPException
from app.auth import create_access_token
import base64

router = APIRouter()

@router.get("/generate-secure-url")
async def generate_secure_url(
    token: str = Query(..., description="Base64 encoded shop ID (e.g. MTA1Nw==)"),
    module: str = Query("stocks", description="The module to redirect to (e.g., stocks, sales, doc)")
):
    """
    Generates a JWT and returns a secure URL for the React frontend.
    The frontend will catch this at /auth, save the token, and redirect to the clean module URL.
    """
    try:
        # Decode the base64 string to get the shop_id
        decoded_bytes = base64.b64decode(token)
        shop_id = int(decoded_bytes.decode('utf-8'))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 token provided")

    # 1. Generate the JWT token for this shop_id
    jwt_token = create_access_token(shop_id)
    
    # 2. Build the secure frontend auth URL
    # Replace 5173 with your actual production frontend URL later
    frontend_base = "http://localhost:5173"
    secure_url = f"{frontend_base}/auth?token={jwt_token}&module={module}"
    
    # 3. Return the exact JSON structure requested
    return {
        "shop_id": shop_id,
        "token": jwt_token,
        "url": secure_url
    }
