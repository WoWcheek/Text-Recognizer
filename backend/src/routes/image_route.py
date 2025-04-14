from fastapi import APIRouter, Depends
from utils.get_user import get_current_user
import easyocr
import base64
from PIL import Image
from io import BytesIO
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, APIRouter, Request

import requests
from config import config
from db.models.User import User


from db.models.User import User

from datetime import datetime

from db.models.Query import Query

reader = easyocr.Reader(['en'])
image_route = APIRouter()

class ImageRequest(BaseModel):
    image: str

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
        'limits': 10  
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
                return {'ratelimits': True}
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
                    return {'ratelimits': True}
        else:
            User.users_collection.update_one({
                'email': userData['email']
            }, {'$inc': {
                'limits.count': 1
            }})
            
    


    base_64_parts = request.image.split("base64,")
    if len(base_64_parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid image data")
    text = decode_text_from_base64(base_64_parts[1])
    print("📤 Sending to Query.create")
    Query.create({
    "userId": str(userData['_id']),
    "image": request.image,
    "text": text
    })
    print("✅ Query.create executed")
    print("📦 Text:", repr(text))  

    return {"decoded_text": text}

@image_route.post("/image/analyze-review")
async def analyze_review(request: Request, user=Depends(get_current_user)):
    data = await request.json()
    image = data.get("image")

    if not image:
        raise HTTPException(status_code=400, detail="Image is required")

    email = user["email"]
    user_data = User.users_collection.find_one({'email': email})
    subscription = user_data.get("subscription", {})
    sub_type = subscription.get("type", "free")

    if sub_type != "review":
        raise HTTPException(status_code=403, detail="Цей функціонал доступний лише для тарифу 'review'")

    try:
        ocr_response = requests.post("http://localhost/read-from-image", json={"image": image})
        if ocr_response.status_code != 200:
            raise HTTPException(status_code=500, detail="Не вдалося розпізнати текст з зображення")
        decoded_text = ocr_response.json().get("decoded_text", "")

        sentiment_response = requests.post(
            "http://localhost/sentiment-analysis/single",
            json={"review": decoded_text, "language": "ru"} 
        )

        if sentiment_response.status_code != 200:
            raise HTTPException(status_code=500, detail="Не вдалося проаналізувати тональність")

        sentiment_data = sentiment_response.json()

        return {
            "decoded_text": decoded_text,
            "is_review": True,  
            "sentiment": sentiment_data.get("tonality", "невідомо")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка при надсиланні до AI: {str(e)}")

