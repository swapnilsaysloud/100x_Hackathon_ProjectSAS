from backend.core.extractor import FeatureExtractor
from backend.core.model import FeedbackModel

class CandidateRanker:
    def __init__(self, model: FeedbackModel, extractor: FeatureExtractor):
        self.model = model
        self.extractor = extractor

    def rank(self, candidates: list[dict], job: dict) -> list[dict]:
        features = [self.extractor.to_vector(self.extractor.extract(c, job)) for c in candidates]
        scores = self.model.predict_proba(features)
        ranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
        return [{"candidate": c, "score": s} for c, s in ranked]
