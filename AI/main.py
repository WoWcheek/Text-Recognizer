import easyocr

reader = easyocr.Reader(['en'])

image_path = "figure-65.png"
result = reader.readtext(image_path, detail=0)

print(result)