from fastapi import APIRouter, Depends
from utils.get_user import get_current_user
import easyocr
import base64
from PIL import Image
from io import BytesIO
from pydantic import BaseModel
from fastapi import HTTPException, APIRouter
from bson import ObjectId
from transformers import pipeline
from config import config
from db.models.User import User
from datetime import datetime
from db.models.Query import Query
from bson.errors import InvalidId

reader = easyocr.Reader(['ru', 'uk', 'en'])
image_route = APIRouter()
sentiment_pipeline = pipeline("sentiment-analysis", model="blanchefort/rubert-base-cased-sentiment")

class ImageRequest(BaseModel):
    image: str

class FeedbackRequest(BaseModel):
    query_id: str
    feedback: str  # "agree", "disagree", "unknown"
PLANS = {
    'free': {
        'limits': 5
    },
    'standart': {
        'limits': 20,
    },
    'pro': {
        'limits': -1,
    },
    'review': {
        'limits': -1  
    }
}

def decode_text_from_base64(base64_string: str) -> str:
    try:
        image_data = base64.b64decode(base64_string)
        image = Image.open(BytesIO(image_data))
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        result = reader.readtext(buffered.getvalue(), detail=0)
        return " ".join(result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")

@image_route.post("/read-from-image")
def read_from_image(request: ImageRequest, user: dict = Depends(get_current_user)):
    userData = user 

    limits = userData['limits']
    subscription_type = userData['subscription']['type']
    count_limit = PLANS[subscription_type]['limits']

    if count_limit != -1:
        if count_limit <= limits['count']:
            if limits['time'] == -1:
                User.users_collection.update_one({
                    'email': userData['email']
                }, {'$set': {
                    'limits.time': datetime.now().timestamp() + 86400
                }})
                raise HTTPException(status_code=429, detail="Ліміт запитів вичерпано для вашого тарифу")
            else:
                if limits['time'] < datetime.now().timestamp():
                    User.users_collection.update_one({
                        'email': userData['email']
                    }, {'$set': {
                        'limits': {
                            'count': 0,
                            'time': -1
                        }
                    }})
                else:
                    raise HTTPException(status_code=429, detail="Ліміт запитів вичерпано для вашого тарифу")
        else:
            User.users_collection.update_one({
                'email': userData['email']
            }, {'$inc': {
                'limits.count': 1
            }})

    if "base64," in request.image:
        base64_data = request.image.split("base64,")[1] 
    else:
        base64_data = request.image  

    try:
        text = decode_text_from_base64(base64_data)
        print("📤 Sending to Query.create")

        Query.create({
            "userId": str(userData['_id']),
            "image": request.image,
            "text": text
        })
        print("✅ Query.create executed")
        print("📦 Text:", repr(text))

        return {"decoded_text": text}
    
    except Exception as e:
        print(f"Помилка при розпізнаванні зображення: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Помилка при розпізнаванні зображення: {str(e)}")
    
@image_route.post("/sentiment-feedback")
async def sentiment_feedback(request: FeedbackRequest, user: dict = Depends(get_current_user)):

    if request.feedback not in ["agree", "disagree", "unknown"]:
        raise HTTPException(status_code=400, detail="Недопустиме значення фідбеку")
    
    try:
        obj_id = ObjectId(request.query_id)
    except InvalidId:
        raise HTTPException(status_code=422, detail="Недійсний ID запиту")

    updated = Query.collection.update_one(
        {"_id": obj_id, "userId": str(user["_id"])},
        {"$set": {"feedback": request.feedback}}
    )

    if updated.modified_count == 0:
        raise HTTPException(status_code=404, detail="Запис не знайдено або не належить користувачу")

    return {"message": "Фідбек збережено успішно"}

@image_route.get("/feedback", tags=["Feedback"])
async def get_feedback_queries(user: dict = Depends(get_current_user)):
    feedbacks = list(Query.collection.find({
        "userId": str(user["_id"]),
        "feedback": {"$in": ["agree", "disagree"]}
    }))
    for f in feedbacks:
        f["_id"] = str(f["_id"])
    return feedbacks
