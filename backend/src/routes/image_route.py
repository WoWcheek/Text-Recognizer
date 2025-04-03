from fastapi import APIRouter, Depends
from utils.get_user import get_current_user
import easyocr
import base64
from PIL import Image
from io import BytesIO
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, APIRouter

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
    userData = User.users_collection.find_one({'email': user['sub']})
    limits = userData['limits']

    subscription_type = userData['subscription']['type']

    count_limit = PLANS[subscription_type]['limits']

    if count_limit != -1:
        if count_limit <= limits['count']:

            if limits['time'] == -1:
                User.users_collection.update_one({
                    'email': user['sub']
                }, 
                {'$set': {
                    'limits.time': datetime.now().timestamp() + 86400
                }})

                return {'ratelimits': True}
            else:
                if limits['time'] < datetime.now().timestamp():
                    User.users_collection.update_one({
                        'email': user['sub']
                    }, 
                        {'$set': {
                            'limits': {
                                'count': 0,
                                'time': -1
                            }
                    }})
                else:
                    return {'ratelimits': True}
        else:
             User.users_collection.update_one({
                    'email': user['sub']
                }, 
                {'$inc': {
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
