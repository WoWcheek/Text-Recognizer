from fastapi import APIRouter
import requests
from datetime import datetime, timedelta
from config import config
from db.models.User import User

monobank = APIRouter()

@monobank.get("/api/monobank/check-payments")
def check_payments():
    token = config["MONOBANK_PERSONAL_TOKEN"]
    account_id = config["MONOBANK_ACCOUNT_ID"]

    now = datetime.utcnow()
    from_time = int((now - timedelta(hours=24)).timestamp())

    headers = {"X-Token": token}
    url = f"https://api.monobank.ua/personal/statement/{account_id}/{from_time}"

    res = requests.get(url, headers=headers)
    data = res.json()

    activated = []

    for tx in data:
        if tx.get("amount", 0) > 0:
            description = tx.get("description", "")
            for user in User.users_collection.find():
                if user["email"].lower() in description.lower():
                    User.users_collection.update_one(
                        {"email": user["email"]},
                        {
                            "$set": {
                                "subscription.type": "pro",
                                "subscription.startDate": datetime.utcnow().isoformat()
                            },
                            "$inc": {"balance": tx["amount"] / 100}
                        }
                    )
                    activated.append(user["email"])

    return {"activated": activated}
