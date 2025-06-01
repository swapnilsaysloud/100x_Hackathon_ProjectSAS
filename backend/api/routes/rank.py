from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from backend.core.model import FeedbackModel
from backend.core.ranker import CandidateRanker
from backend.core.extractor import SemanticJobExtractor

extractor = SemanticJobExtractor()
router = APIRouter()

# Initialize or load model
model = FeedbackModel()

# If model is untrained, simulate and train
try:
    model.predict_proba([[1, 2, 1]])  # Test if trained
except Exception:
    X, y = model.simulate_training_data()
    model.train(X, y)

# Initialize ranker with model
ranker = CandidateRanker(model, extractor)

class RankingRequest(BaseModel):
    candidates: List[dict]

@router.post("/rank-candidates")
def rank_candidates(req: RankingRequest):
    return ranker.rank(req.candidates)
