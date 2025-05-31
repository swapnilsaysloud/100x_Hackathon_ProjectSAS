import os
import joblib
from sklearn.linear_model import LogisticRegression

class FeedbackModel:
    def __init__(self, model_path: str = "data/model.pkl"):
        self.model_path = model_path
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
        else:
            self.model = LogisticRegression()
            self.save()

    def save(self):
        joblib.dump(self.model, self.model_path)

    def predict_proba(self, features: list[list[float]]) -> list[float]:
        return self.model.predict_proba(features)[:, 1].tolist()

    def train(self, X: list[list[float]], y: list[int]):
        self.model.fit(X, y)
        self.save()
