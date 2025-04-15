from pydantic import BaseModel
from nltk.sentiment import SentimentIntensityAnalyzer
from fastapi import HTTPException
from typing import List
from deep_translator import GoogleTranslator


class SingleReviewRequest(BaseModel):
    review: str

class ManyReviewsRequest(BaseModel):
    reviews: List[str]

analyzer = SentimentIntensityAnalyzer()

async def analyze_sentiment(text: str) -> str:
    try:
        translated = GoogleTranslator(source='auto', target='en').translate(text)
        text = translated

        score = analyzer.polarity_scores(text)

        if score["compound"] >= 0.05:
            return "POSITIVE"
        elif score["compound"] <= -0.05:
            return "NEGATIVE"
        else:
            return "NEUTRAL"
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
