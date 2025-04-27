from db.db import queries_collection
from datetime import datetime
from fastapi import HTTPException
from bson import ObjectId

class Query:
    collection = queries_collection
    

    @staticmethod
    def create(data):
        print("📥 Creating query with data:", data)
        try:
            result = Query.collection.insert_one({
                "userId": data["userId"],
                "image": data["image"],
                "text": data["text"],
                "tonality": data.get("tonality"),
                "feedback": data.get("feedback"),
                "createdAt": datetime.utcnow()
            })
            print("✅ Inserted with ID:", str(result.inserted_id))
            return {"status": "created", "id": str(result.inserted_id)}
        except Exception as e:
            print("❌ Error inserting query:", e)
            raise HTTPException(status_code=500, detail=f"Failed to create query: {str(e)}")


    @staticmethod
    def get_by_user(user_id):
        return [Query.serialize_query(q) for q in Query.collection.find({"userId": user_id})]

    @staticmethod
    def get_all():
        print("⏳ Викликається Query.get_all")
        try:
            results = list(Query.collection.find())
            print("✅ Успішно знайдено:", results)
            return [Query.serialize_query(q) for q in results]
        except Exception as e:
            print("❌ Помилка при get_all:", e)
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    def serialize_query(query):
        query["_id"] = str(query["_id"])
        if "createdAt" in query:
            query["createdAt"] = query["createdAt"].isoformat()
        return query
