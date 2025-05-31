from pymongo import MongoClient
from pymongo.collection import Collection
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "candidates")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "resumes")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

def get_mongo_collection() -> Collection:
    return collection