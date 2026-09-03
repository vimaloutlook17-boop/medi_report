import jwt
import datetime
import os
from dotenv import load_dotenv
from fastapi import Header, HTTPException

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "medi_reports_jwt_secret_key_prod_2026")
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
