import jwt
from config import config
from fastapi import HTTPException, Request

async def get_current_user(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        token = token.split("Bearer ")[1]
        payload = jwt.decode(token, config['SECRET'], algorithms=["HS256"])
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")