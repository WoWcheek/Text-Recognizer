from fastapi import APIRouter, Depends, Body, Request, HTTPException
from utils.get_user import get_current_user
from passlib.hash import bcrypt
from db.models.User import User
from datetime import datetime
from db.models.User import User
from db.models.Query import Query
from fastapi import Body
from utils.get_user import verify_token
import uuid
import requests
from config import config
from datetime import datetime, timedelta
import jwt


user_route = APIRouter()

@user_route.post("/auth/register")
def register_user(data: dict = Body(...)):
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    if User.users_collection.find_one({'email': email}):
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = bcrypt.hash(password)
    new_user = {
        "_id": email,
        "email": email,
        "password": hashed_password,
        "name": email.split("@")[0],
        "role": "user",
        "subscription": {
            "type": "free",
            "time": -1,
            "startDate": datetime.utcnow().isoformat()
        },
        "limits": {
            "count": 0,
            "time": -1
        }
    }

    User.create(new_user)
    token = jwt.encode({"sub": email, "name": new_user["name"], "exp": datetime.utcnow() + timedelta(hours=1)}, config['SECRET'], algorithm="HS256")
    return {"token": token}

@user_route.post("/auth/login")
def login_user(data: dict = Body(...)):
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    user = User.users_collection.find_one({"email": email})
    if not user or not bcrypt.verify(password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode({"sub": email, "name": user.get("name", ""), "exp": datetime.utcnow() + timedelta(hours=1)}, config['SECRET'], algorithm="HS256")
    return {"token": token}


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
    email = user["email"]

    db_user = User.users_collection.find_one({"email": email})
    subscription = db_user.get("subscription", {})
    limits = db_user.get("limits", {})

    sub_type = subscription.get("type", "free")
    count = limits.get("count", 0)

    max_requests = {
        "free": 3,
        "standart": 7,
        "pro": float("inf")
    }

    if count >= max_requests.get(sub_type, 3):
        raise HTTPException(status_code=403, detail=f"Досягнуто ліміту запитів для тарифу '{sub_type}'")

    result = Query.create({
        "userId": user_id,
        "image": image,
        "text": text
    })

    User.users_collection.update_one(
        {"email": email},
        {"$inc": {"limits.count": 1}}
    )

    return result


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
        return {'error': 'only free/standart/pro'}

    price_map = {
        'standart': 1.00,
        'pro': 5.00
    }
    amount = int(price_map.get(_type, 0) * 100)

    # Створення інвойсу для імітації
    response = requests.post(
        "https://api.monobank.ua/api/merchant/invoice/create",
        headers={"X-Token": config["MONOBANK_PERSONAL_TOKEN"]},
        json={
            "invoiceId": str(uuid.uuid4()),
            "amount": amount,
            "ccy": 980,
            "redirectUrl": "http://localhost:3000/payment/success",
            "validity": 3600,
            "destination": f"Оплата тарифу {_type}"
        }
    )

    # Одразу оновлюємо підписку, не чекаючи підтвердження
    start_date = datetime.utcnow().isoformat()
    User.users_collection.update_one(
        {'email': user['email']},
        {
            '$set': {
                'subscription': {
                    'type': _type,
                    'time': -1,
                    'startDate': start_date
                },
                'balance': 0 
            }
        },
        upsert=True
    )

    if response.status_code == 200:
        invoice_url = response.json().get("pageUrl")
        return {"invoiceUrl": invoice_url}

    return {"error": "Не вдалося створити інвойс Monobank"}





@user_route.post("/admin/set-subscription/{user_id}")
async def set_subscription_for_user(user_id: str, request: Request, user: dict = Depends(get_current_user)):
    if not user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Тільки для адміністратора")

    data = await request.json()
    _type = data.get("type")

    if _type not in ['free', 'standart', 'pro']:
        return {'error': 'Тариф має бути один з: free, standart, pro'}

    start_date = datetime.utcnow().isoformat()

    result = User.users_collection.update_one(
        {'_id': user_id},
        {'$set': {
            'subscription.type': _type,
            'subscription.time': -1,
            'subscription.startDate': start_date
        },
         '$setOnInsert': { 'balance': 0 }}
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

@user_route.post("/admin/set-limit/{user_id}")
def set_limit_for_user(user_id: str, data: dict = Body(...), user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    count = data.get("count")

    if count is None or not isinstance(count, int) or count < 0:
        raise HTTPException(status_code=400, detail="Некоректне значення count")

    result = User.users_collection.update_one(
        {"_id": user_id},
        {"$set": {"limits.count": count}}
    )

    return {"status": "updated", "modified_count": result.modified_count}


