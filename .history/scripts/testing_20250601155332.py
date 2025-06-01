from pymongo import MongoClient
from backend.core.embedder import SemanticEmbedder

client = MongoClient("mongodb://localhost:27017/")
db = client["candidates_db"]
collection = db["candidates"]

embedder = SemanticEmbedder()

candidates = [
    {
        "name": "Alice",
        "skills": ["Python", "ML", "AWS"],
        "experience": 5,
        "qualifications": ["MSc Computer Science"],
        "summary": "Data scientist with 5 years of experience in Python, ML, AWS",
    },
    {
        "name": "Bob",
        "skills": ["Java", "Spring"],
        "experience": 3,
        "qualifications": ["BSc Information Technology"],
        "summary": "Backend developer with Java and Spring expertise",
    }
]

for c in candidates:
    c["embedding"] = embedder.encode(c["summary"])
    collection.insert_one(c)

print("Inserted test candidates.")
