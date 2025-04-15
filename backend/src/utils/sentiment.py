from pydantic import BaseModel
from nltk.sentiment import SentimentIntensityAnalyzer
from fastapi import HTTPException
from typing import List
from deep_translator import GoogleTranslator


class SingleReviewRequest(BaseModel):
    review: str
    language: str = "en"

class ManyReviewsRequest(BaseModel):
    reviews: List[str]
    language: str = "en"

analyzer = SentimentIntensityAnalyzer()

async def analyze_sentiment(text: str, language: str = "en") -> str:
    try:
        if language.lower() == "ru":
            translated = GoogleTranslator(source='auto', target='en').translate(text)
            text = translated


        score = analyzer.polarity_scores(text)

        if score["compound"] >= 0.05:
            return "Позитивний"
        elif score["compound"] <= -0.05:
            return "Негативний"
        else:
            return "Нейтральний"
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
