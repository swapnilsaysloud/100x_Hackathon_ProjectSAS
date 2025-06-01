from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict
from backend.core.extractor import JobFeatureExtractor
from backend.core.embedder import SemanticEmbedder
from backend.core.searcher import CandidateSearcher
from backend.dependencies import get_mongo_collection
from pymongo.collection import Collection

router = APIRouter()

# Instantiate shared components
extractor = JobFeatureExtractor()
embedder = SemanticEmbedder()


class SearchRequest(BaseModel):
    job_description: str
    top_k: int = 100


@router.post("/semantic-search")
def semantic_search(req: SearchRequest, collection: Collection = Depends(get_mongo_collection)) -> List[Dict]:
    # Step 1: Extract job features
    features = extractor.extract(req.job_description)

    # Step 2: Generate standardized query (summary-style)
    skills = features.get("skills", [])
    experience = features.get("experience", None)
    qualifications = features.get("qualifications", [])

    standardized_query = (
        f"Looking for a candidate with experience in {', '.join(skills)}"
        f"{f', at least {experience} years' if experience else ''}"
        f"{f', and qualifications including {', '.join(qualifications)}' if qualifications else ''}."
    )

    # Step 3: Embed the query
    query_embedding = embedder.encode(standardized_query)

    # Step 4: Search MongoDB
    searcher = CandidateSearcher(collection)
    results = searcher.search(query_embedding, top_k=req.top_k)

    return {
        "query": standardized_query,
        "extracted_features": features,
        "results": results
    }
