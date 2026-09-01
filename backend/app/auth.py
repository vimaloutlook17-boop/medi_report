import jwt
import datetime
from fastapi import Header, HTTPException

SECRET_KEY = "your-super-secret-production-key"  # Change this in production!
ALGORITHM = "HS256"

def create_access_token(shop_id: int):
    """Generate a JWT token with the shop_id encrypted inside"""
    payload = {
        "shop_id": shop_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12) # Token expires in 12 hours
    }
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(authorization: str = Header(..., description="Bearer JWT Token")):
    """Dependency to extract shop_id from the JWT token"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = authorization.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        shop_id = payload.get("shop_id")
        if shop_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return shop_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
