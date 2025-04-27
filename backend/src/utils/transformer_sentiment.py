from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
import numpy as np
import os

MODEL_PATH = "models/custom-sentiment"
DEFAULT_MODEL = "cardiffnlp/twitter-xlm-roberta-base-sentiment"

labels = ['negative', 'neutral', 'positive']

if os.path.exists(MODEL_PATH):
    print("✅ Завантаження кастомної моделі...")
    selected_model = MODEL_PATH
else:
    print("ℹ️ Завантаження базової моделі...")
    selected_model = DEFAULT_MODEL

tokenizer = AutoTokenizer.from_pretrained(selected_model)
model = AutoModelForSequenceClassification.from_pretrained(selected_model)

def predict_sentiment(text: str) -> str:
    inputs = tokenizer(text, return_tensors="pt", truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
    scores = outputs.logits.softmax(dim=1).squeeze().numpy()
    return labels[np.argmax(scores)]
