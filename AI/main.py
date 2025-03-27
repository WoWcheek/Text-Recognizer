import easyocr
import base64
from PIL import Image
from io import BytesIO
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException

app = FastAPI()
reader = easyocr.Reader(['en'])

class ImageRequest(BaseModel):
    image: str

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
