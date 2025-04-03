import jwt
from config import config
from fastapi import HTTPException, Request, Depends, status
from db.models.User import User


from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
SECRET_KEY = "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"
ALGORITHM = "HS256"

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        user = User.users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        return user

    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")



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
    
    