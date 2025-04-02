import jwt
from config import config
from fastapi import HTTPException, Request
from db.models.User import User

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

def verify_token(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        token = token.split("Bearer ")[1]
        payload = jwt.decode(token, config['SECRET'], algorithms=["HS256"])
        email = payload.get("sub")

        if not email:
            raise HTTPException(status_code=403, detail="Invalid token")

        user_data = User.users_collection.find_one({"email": email})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")

        return user_data
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))
    
    