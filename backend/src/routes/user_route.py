from fastapi import APIRouter, Depends, Request, HTTPException
from utils.get_user import get_current_user
from bson import ObjectId
from db.models.User import User

from db.models.User import User
from db.models.Query import Query
from fastapi import Body
from utils.get_user import verify_token

user_route = APIRouter()


@user_route.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {
        "user": user
    }

@user_route.get("/subscription")
async def get_subscription(user: dict = Depends(get_current_user)):
    user_data = User.users_collection.find_one({'email': user['email']})

    return {
        "data": user_data['subscription']
    }

@user_route.post("/query")
def create_query(data: dict = Body(...)):
    user_id = data.get("userId")
    image = data.get("image")
    text = data.get("text")

    if not all([user_id, image, text]):
        raise HTTPException(status_code=400, detail="Missing fields")

    return Query.create({
    "userId": user_id,
    "image": image,
    "text": text
})

@user_route.post("/user/query")
def create_query_by_user(data: dict = Body(...), user=Depends(get_current_user)):
    image = data.get("image")
    text = data.get("text")

    if not image or not text:
        raise HTTPException(status_code=400, detail="Image and text are required")

    user_id = str(user["_id"])

    return Query.create({
        "userId": user_id,
        "image": image,
        "text": text
    })

@user_route.get("/admin/queries")
def get_all_queries():
    return Query.get_all()

@user_route.get("/admin/queries/{user_id}")
def get_user_queries(user_id: str):
    return Query.get_by_user(user_id)


@user_route.get("/admin/users")
def get_all_users(user_data=Depends(verify_token)):
    if user_data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    users = list(User.users_collection.find())

    for user in users:
        user_id = str(user["_id"])
        query_count = Query.collection.count_documents({"userId": user_id})
        user["queryCount"] = query_count
        user["_id"] = user_id  

    return users


@user_route.post("/subscription/buy")
async def buy_subscription(request: Request, user: dict = Depends(get_current_user)):
    data = await request.json()
    _type = data.get("type")

    if _type not in ['free', 'standart', 'pro']:
        return {
            'error': 'only free/standart/pro'
        }
    
    new_data = User.users_collection.update_one({
        'email': user['email']
    }, {'$set': {
        'subscription': {
            'type': _type,
            'time': -1
        }
    }})

@user_route.post("/admin/set-subscription/{user_id}")
async def set_subscription_for_user(user_id: str, request: Request, user: dict = Depends(get_current_user)):
    if not user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Тільки для адміністратора")

    data = await request.json()
    _type = data.get("type")

    if _type not in ['free', 'standart', 'pro']:
        return {'error': 'Тариф має бути один з: free, standart, pro'}

    result = User.users_collection.update_one(
        {'_id': user_id},
        {'$set': {'subscription': {'type': _type, 'time': -1}}}
    )

    return {"status": "success", "modified_count": result.modified_count}


@user_route.delete("/admin/delete/{user_id}")
async def delete_user(user_id: str):
    from db.models.User import User

    result = User.users_collection.delete_one({"_id": user_id})
    if result.deleted_count == 1:
        return {"status": "deleted"}
    return {"error": "User not found"}

@user_route.patch("/admin/edit/{user_id}")
async def update_user_role(user_id: str, data: dict):
    from db.models.User import User

    new_role = data.get("role")
    if new_role not in ["admin", "user"]:
        return {"error": "Invalid role"}

    result = User.users_collection.update_one(
        {"_id": user_id},
        {"$set": {"role": new_role}}
    )
    if result.modified_count == 1:
        return {"status": "updated"}
    return {"error": "User not found or role unchanged"}


    return {
        "ok": True
    }

