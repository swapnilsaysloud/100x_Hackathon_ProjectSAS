from pymongo import MongoClient
from backend.core.embedder import SemanticEmbedder

client = MongoClient("mongodb+srv://poddarronit03:4t8HWfqnKaHTPnaB@cluster0.4gz2iwu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["candidates"]
collection = db["resumes"]

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
