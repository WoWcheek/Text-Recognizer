import logging
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from deep_translator import GoogleTranslator

translate_route = APIRouter()

class TranslateRequest(BaseModel):
    text: str
    to: str

@translate_route.post("/translate")
async def translate_text(request: TranslateRequest):
    if not request.text or not request.to:
        raise HTTPException(status_code=400, detail="Text and target language required")
    try:
        result = GoogleTranslator(source='auto', target=request.to).translate(request.text)
        return {"translated_text": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@translate_route.get("/translate/languages")
def get_supported_languages():
    try:
        translator = GoogleTranslator()
        langs = translator.get_supported_languages(as_dict=True)
        return {"languages": langs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
