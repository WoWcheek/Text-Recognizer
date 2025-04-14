import nltk
import base64
import easyocr
from PIL import Image
from io import BytesIO
from typing import List
from pydantic import BaseModel
from googletrans import Translator
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from nltk.sentiment import SentimentIntensityAnalyzer

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
nltk.download('vader_lexicon')
reader = easyocr.Reader(['en', 'ru'])

class ImageRequest(BaseModel):
    image: str

class SingleReviewRequest(BaseModel):
    review: str
    language: str = "en"

class ManyReviewsRequest(BaseModel):
    reviews: List[str]
    language: str = "en"

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

@app.post("/read-from-image")
def read_from_image(request: ImageRequest):
    base_64_parts = request.image.split("base64,")
    if len(base_64_parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid image data")
    text = decode_text_from_base64(base_64_parts[1])
    return {"decoded_text": text}

async def analyze_sentiment(text: str, language: str):
    try:
        translator = Translator()
        if language.lower() == "ru":
            translated_text = await translator.translate(text, src='ru', dest='en')
            translated_text = translated_text.text
        else:
            translated_text = text
        sia = SentimentIntensityAnalyzer()
        scores = sia.polarity_scores(translated_text)

        if scores['compound'] >= 0.05:
            return "Positive"
        elif scores['compound'] <= -0.05:
            return "Negative"
        else:
            return "Neutral"
    except:
        raise Exception("Error during sentiment analysis")

@app.post("/sentiment-analysis/single")
async def analyze_review(request: SingleReviewRequest):
    try:
        sentiment = await analyze_sentiment(request.review, request.language)
        return {"tonality": sentiment}
    except Exception as ex:
        HTTPException(status_code=400, detail=ex)

@app.post("/sentiment-analysis/many")
async def analyze_review(request: ManyReviewsRequest):
    sentiments_list = []
    for review in request.reviews:
        try:
            sentiment = await analyze_sentiment(review)
            sentiments_list.append(sentiment)
        except:
            sentiments_list.append(None)
    return {"tonality": sentiments_list}