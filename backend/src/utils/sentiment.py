from pydantic import BaseModel
from fastapi import HTTPException
from typing import List
from utils.transformer_sentiment import predict_sentiment
from deep_translator import GoogleTranslator



class SingleReviewRequest(BaseModel):
    review: str
    language: str = "uk"

class ManyReviewsRequest(BaseModel):
    reviews: List[str]
    language: str = "uk"


async def analyze_sentiment(text: str, language: str = "uk") -> str:
    try:
        if language in ["ru", "uk"]:
            from deep_translator import GoogleTranslator
            target_lang = "en"
            text = GoogleTranslator(source=language, target=target_lang).translate(text)
        return predict_sentiment(text)
    except Exception as e:
        return "невідомо"