from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from pymongo import MongoClient
from app.core.searcher import CandidateSearcher
from app.dependencies import get_mongo_collection

router = APIRouter()

class SearchRequest(BaseModel):
    embedding: List[float]
    top_k: int = 100

@router.post("/semantic-search")
def semantic_search(req: SearchRequest, collection=Depends(get_mongo_collection)):
    searcher = CandidateSearcher(collection)
    results = searcher.search(req.embedding, top_k=req.top_k)
    return results