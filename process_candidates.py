import os
import pymongo
from dotenv import load_dotenv
from tqdm import tqdm

from backend.core.embedder import SemanticEmbedder

load_dotenv()

# Initialize components
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://poddarronit03:4t8HWfqnKaHTPnaB@cluster0.4gz2iwu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
DB_NAME = "candidates"
COLLECTION_NAME = "resumes"

client = pymongo.MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

embedder = SemanticEmbedder()


def build_candidate_summary(candidate: dict) -> str:
    name = candidate.get("name", "A candidate")
    experience = candidate.get("experience", 0)
    experience_str = f"{experience}+ years of experience" if experience else "some experience"

    skills = candidate.get("skills", [])
    skills_str = ", ".join(skills) if skills else "various skills"

    qualifications = candidate.get("qualifications", [])
    qualifications_str = ", ".join(qualifications) if qualifications else "relevant qualifications"

    return f"{name} with {experience_str}, skilled in {skills_str}, and holding {qualifications_str}."


def update_candidates_with_summaries_and_vectors():
    candidates = list(collection.find({}))

    for candidate in tqdm(candidates, desc="Processing candidates"):
        summary = build_candidate_summary(candidate)
        embedding = embedder.encode(summary)

        collection.update_one(
            {"_id": candidate["_id"]},
            {"$set": {
                "summary": summary,
                "vector": embedding
            }}
        )


if __name__ == "__main__":
    update_candidates_with_summaries_and_vectors()
    print("✅ Candidate summaries and vectors updated.")
