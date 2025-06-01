# search.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict # Import ConfigDict for Pydantic V2
from typing import List, Dict, Any, Optional
from backend.core.extractor import SemanticJobExtractor
from backend.core.embedder import SemanticEmbedder
from backend.core.searcher import CandidateSearcher
from backend.dependencies import get_mongo_collection
from pymongo.collection import Collection
from bson import ObjectId # IMPORT ObjectId

router = APIRouter()

extractor = SemanticJobExtractor()
embedder = SemanticEmbedder()

class SearchRequest(BaseModel):
    job_description: str
    top_k: int = Field(default=100, gt=0, le=1000)

class SearchResultItem(BaseModel):
    # Explicitly use ConfigDict for Pydantic V2 configuration
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={
            ObjectId: str
        },
        extra='allow',
        arbitrary_types_allowed=True  # <--- ADD THIS LINE
    )

    # This field will be populated from MongoDB's '_id'
    mongo_id: ObjectId = Field(alias="_id") # Type hint as ObjectId
    score: Optional[float] = None
    title: Optional[str] = None
    company: Optional[str] = None
    # Add other fields you expect


class SearchResponse(BaseModel):
    # Also add config here, especially if SearchResponse could ever directly contain an ObjectId
    model_config = ConfigDict(
        json_encoders={
            ObjectId: str
        },
        arbitrary_types_allowed=True # Add here too for consistency if needed
    )
    query: str
    extracted_features: Dict[str, Any]
    results: List[SearchResultItem]


@router.post("/semantic-search", response_model=SearchResponse)
def semantic_search(req: SearchRequest, collection: Collection = Depends(get_mongo_collection)) -> SearchResponse:
    try:
        features = extractor.extract_fields(req.job_description)
        if not isinstance(features, dict):
            # print(f"Extractor returned non-dict: {features}") # Debug
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

        if not query_parts:
            standardized_query = "Seeking a general candidate profile based on the job description."
        else:
            standardized_query = f"Seeking a candidate with {'; '.join(query_parts)}."

        query_embedding = embedder.encode(standardized_query)
        if not query_embedding or not isinstance(query_embedding, list):
            # print(f"Embedder returned invalid embedding: {query_embedding}") # Debug
            raise HTTPException(status_code=500, detail="Query embedding failed.")

        searcher = CandidateSearcher(collection)
        mongo_results = searcher.search(embedding=query_embedding, top_k=req.top_k)

        # --- DEBUGGING (keep for now if issues persist) ---
        # print(f"Number of results from MongoDB: {len(mongo_results)}")
        # if mongo_results:
        #     print(f"First MongoDB result item (raw dict from DB): {mongo_results[0]}")
        #     first_item_raw = mongo_results[0]
        #     if isinstance(first_item_raw, dict):
        #         if '_id' in first_item_raw:
        #             print(f"Type of '_id' in first raw result: {type(first_item_raw['_id'])}")
        #         else:
        #             print("'_id' field not found in the first raw result item.")
        #         for key, value in first_item_raw.items():
        #             print(f"Raw item key: '{key}', type: {type(value)}")
        # --- END DEBUGGING ---

        response_payload = SearchResponse(
            query=standardized_query,
            extracted_features=features,
            results=mongo_results
        )
        return response_payload

    except HTTPException:
        raise
    except Exception as e:
        # import traceback
        # print(traceback.format_exc())
        print(f"An unexpected error occurred in semantic_search: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")