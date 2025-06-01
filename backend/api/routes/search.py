# search.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
from backend.core.extractor import SemanticJobExtractor
from backend.core.embedder import SemanticEmbedder
from backend.core.searcher import CandidateSearcher
from backend.dependencies import get_mongo_collection
from pymongo.collection import Collection
from bson import ObjectId

router = APIRouter()

# Shared components
extractor = SemanticJobExtractor()
embedder = SemanticEmbedder()


class SearchRequest(BaseModel):
    job_description: str
    top_k: int = Field(default=100, gt=0, le=1000)


class SearchResultItem(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str},
        extra='allow',
        arbitrary_types_allowed=True
    )

    id: str = Field(alias="_id")
    name: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    summary: Optional[str] = None
    skills: Optional[List[str]] = None
    matchScore: Optional[float] = Field(default=None, alias="score")
    avatarUrl: Optional[str] = None
    location: Optional[str] = None
    email: Optional[str] = None


class SearchResponse(BaseModel):
    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        arbitrary_types_allowed=True
    )
    query: str
    extracted_features: Dict[str, Any]
    results: List[SearchResultItem]


@router.post("/semantic-search", response_model=SearchResponse)
def semantic_search(req: SearchRequest, collection: Collection = Depends(get_mongo_collection)) -> SearchResponse:
    try:
        # Step 1: Extract fields from job description
        features = extractor.extract_fields(req.job_description)
        if not isinstance(features, dict):
            raise HTTPException(status_code=500, detail="Feature extraction failed.")

        skills = features.get("skills", [])
        experience = features.get("experience", None)
        qualifications = features.get("qualifications", [])

        query_parts = []
        if skills:
            query_parts.append(f"skills in {', '.join(skills)}")
        if experience:
            query_parts.append(f"experience of {experience}")
        if qualifications:
            query_parts.append(f"qualifications like {', '.join(qualifications)}")

        standardized_query = (
            f"Seeking a candidate with {'; '.join(query_parts)}."
            if query_parts else
            "Seeking a general candidate profile based on the job description."
        )

        # Step 2: Embed the standardized query
        query_embedding = embedder.encode(standardized_query)
        if not query_embedding or not isinstance(query_embedding, list):
            raise HTTPException(status_code=500, detail="Query embedding failed.")

        # Step 3: Perform vector search in MongoDB
        searcher = CandidateSearcher(collection)
        raw_results = searcher.search(embedding=query_embedding, top_k=req.top_k)

        # Step 4: Normalize MongoDB results
        results = []
        for doc in raw_results:
            result = {
                "id": str(doc.get("_id", "")),
                "name": doc.get("name"),
                "title": doc.get("title"),
                "company": doc.get("company"),
                "summary": doc.get("summary"),
                "skills": doc.get("skills", []),
                "matchScore": doc.get("score"),
                "avatarUrl": doc.get("avatarUrl"),
                "location": doc.get("location"),
                "email": doc.get("email")
            }
            results.append(result)

        return SearchResponse(
            query=standardized_query,
            extracted_features=features,
            results=results
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"An unexpected error occurred in semantic_search: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")
