from db.db import db
from datetime import datetime

class Query:
    collection = db.queries

    @staticmethod
    def create(user_id, image_data, recognized_text):
        return Query.collection.insert_one({
            "userId": user_id,
            "image": image_data,
            "text": recognized_text,
            "createdAt": datetime.utcnow()
        })

    @staticmethod
    def get_by_user(user_id):
        return list(Query.collection.find({"userId": user_id}))

    @staticmethod
    def get_all():
        return list(Query.collection.find({}))
