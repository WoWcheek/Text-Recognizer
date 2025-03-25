import easyocr
import base64
from io import BytesIO
from PIL import Image

def read_text_from_base64(base64_string):
    image_data = base64.b64decode(base64_string)
    image = Image.open(BytesIO(image_data))
    
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    
    reader = easyocr.Reader(['en', "uk", "ru"])
    
    result = reader.readtext(buffered.getvalue(), detail=0)
    
    return " ".join(result)

base64_string = ""
text = read_text_from_base64(base64_string)

print("Розпізнаний текст:", text)
