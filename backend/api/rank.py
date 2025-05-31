from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from backend.core.model import FeedbackModel
from backend.core.ranker import CandidateRanker

router = APIRouter()

model = FeedbackModel()
data = model.simulate_training_data()
model.train(data)
ranker = CandidateRanker(model)

class RankingRequest(BaseModel):
    candidates: List[dict]

@router.post("/rank-candidates")
def rank_candidates(req: RankingRequest):
    return ranker.rank(req.candidates)