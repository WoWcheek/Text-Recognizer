from fastapi import APIRouter, Depends, Request
from utils.get_user import get_current_user
from pydantic import BaseModel

from db.models.User import User

user_route = APIRouter()


@user_route.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {
        "user": user
    }

@user_route.get("/subscription")
async def get_subscription(user: dict = Depends(get_current_user)):
    user_data = User.users_collection.find_one({'email': user['sub']})

    return {
        "data": user_data['subscription']
    }

@user_route.post("/subscription/buy")
async def buy_subscription(request: Request, user: dict = Depends(get_current_user)):
    data = await request.json()
    _type = data.get("type")

    if _type not in ['free', 'standart', 'pro']:
        return {
            'error': 'only free/standart/pro'
        }
    
    new_data = User.users_collection.update_one({
        'email': user['sub']
    }, {'$set': {
        'subscription': {
            'type': _type,
            'time': -1
        }
    }})



    return {
        "ok": True
    }