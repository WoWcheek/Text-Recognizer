import pymongo 
from pymongo import MongoClient

from config import config



cluster = MongoClient(config['mongodb_url'])
db = cluster.textai
queries_collection = db.queries
