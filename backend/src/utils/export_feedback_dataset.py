import json
from db.db import queries_collection  
from datetime import datetime

def inverse_tonality(tonality):
    if tonality == "positive":
        return "negative"
    elif tonality == "negative":
        return "positive"
    return "neutral"

def build_dataset():
    dataset = []
    cursor = queries_collection.find({
        "feedback": {"$in": ["agree", "disagree"]},
        "text": {"$exists": True},
        "tonality": {"$exists": True}
    })

    for doc in cursor:
        text = doc["text"]
        tonality = doc["tonality"]
        feedback = doc["feedback"]

        if feedback == "agree":
            label = tonality
        elif feedback == "disagree":
            label = inverse_tonality(tonality)
        else:
            continue

        dataset.append({
            "text": text.strip(),
            "label": label
        })

    return dataset

if __name__ == "__main__":
    data = build_dataset()

    filename = f"feedback_dataset_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Збережено {len(data)} прикладів у файл {filename}")
