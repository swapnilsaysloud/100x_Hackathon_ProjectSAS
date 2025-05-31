from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from backend.core.model import FeedbackModel

router = APIRouter()
model = FeedbackModel()

class FeedbackItem(BaseModel):
    features: List[float]
    label: int

class FeedbackRequest(BaseModel):
    feedback: List[FeedbackItem]

@router.post("/feedback")
def feedback(req: FeedbackRequest):
    import pandas as pd
    df = pd.DataFrame([f.model_dump() for f in req.feedback])
    acc, auc = model.train(df)
    return {"accuracy": acc, "auc": auc}
