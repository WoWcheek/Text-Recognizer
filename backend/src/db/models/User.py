from db.db import db

class User:
    users_collection = db.users

    @staticmethod
    def getAllUsers():
        return User.users_collection.find({})
    
    @staticmethod
    def create(data):
        return User.users_collection.insert_one(data)
    
    @staticmethod
    def findById(id):
        return User.users_collection.find_one({'_id': id})