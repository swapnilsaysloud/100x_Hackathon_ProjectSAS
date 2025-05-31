from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.core.embedder import SemanticEmbedder
from app.core.extractor import FeatureExtractor

router = APIRouter()

embedder = SemanticEmbedder()
extractor = FeatureExtractor(embedder)

class FeatureRequest(BaseModel):
    candidates: List[dict]
    query_embedding: List[float]

@router.post("/extract-features")
def extract_features(req: FeatureRequest):
    results = [
        extractor.extract(c, req.query_embedding) for c in req.candidates
    ]
    return results