from fastapi import APIRouter, Depends
from utils.get_user import get_current_user
import easyocr
import base64
from PIL import Image
from io import BytesIO
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, APIRouter, Request

from utils.sentiment import analyze_sentiment, SingleReviewRequest
from transformers import pipeline
import requests
from config import config
from db.models.User import User


from db.models.User import User

from datetime import datetime

from db.models.Query import Query

reader = easyocr.Reader(['en'])
image_route = APIRouter()
sentiment_pipeline = pipeline("sentiment-analysis", model="blanchefort/rubert-base-cased-sentiment")

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




async def analyze_sentiment(text: str, lang: str = "ru") -> str:
    # 🧾 Лог розпізнаного тексту
    print(f"🧾 Decoded text: '{text}'")

    # 🔍 Перевірка на мову
    if lang != "ru":
        print("🌐 Unsupported language, only 'ru' is supported.")
        return "невідомо"

    # 🔍 Перевірка на порожній текст
    if not text.strip():
        print("⚠️ Text is empty or whitespace.")
        return "невідомо"

    try:
        result = sentiment_pipeline(text)
        print(f"🧠 Sentiment pipeline output: {result}")

        if not result or 'label' not in result[0]:
            print("⚠️ No label found in result.")
            return "невідомо"

        label = result[0]['label']

        if label == 'POSITIVE':
            return "позитивний"
        elif label == 'NEGATIVE':
            return "негативний"
        else:
            return "нейтральний"

    except Exception as e:
        print(f"❌ Sentiment analysis error: {str(e)}")
        return "невідомо"

