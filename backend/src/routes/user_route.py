from fastapi import APIRouter, Depends, Request, HTTPException
from utils.get_user import get_current_user

from db.models.User import User

from db.models.User import User
from db.models.Query import Query
from utils.get_user import verify_token

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

@user_route.get("/user/queries")
def get_user_queries(user_data=Depends(verify_token)):
    return Query.get_by_user(user_data["_id"])

@user_route.get("/admin/queries")
def get_all_queries(user_data=Depends(verify_token)):
    # if user_data.get("role") != "admin":
    #     raise HTTPException(status_code=403, detail="Доступ заборонено")

    return Query.get_all()

@user_route.get("/admin/users")
def get_all_users(user_data=Depends(verify_token)):
    # if user_data.get("role") != "admin":
    #     raise HTTPException(status_code=403, detail="Доступ заборонено")
    return list(User.users_collection.find())


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

