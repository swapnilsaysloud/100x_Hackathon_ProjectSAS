import os
import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.exceptions import NotFittedError
import random

class FeedbackModel:
    def __init__(self, model_path: str = "data/model.pkl"):
        self.model_path = model_path
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        else:
            self.model = LogisticRegression()
            self._initialize_with_dummy_data()
            self.save()

    def _initialize_with_dummy_data(self):
        X_dummy = np.array([[1, 2, 1], [0, 5, 0], [3, 1, 1]])
        y_dummy = [1, 0, 1]
        self.model.fit(X_dummy, y_dummy)

    def save(self):
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)

    def predict_proba(self, features: list[list[float]]) -> list[float]:
        try:
            return self.model.predict_proba(features)[:, 1].tolist()
        except NotFittedError:
            self._initialize_with_dummy_data()
            self.save()
            return self.model.predict_proba(features)[:, 1].tolist()

    def train(self, X: list[list[float]], y: list[int]):
        self.model.fit(X, y)
        self.save()

    def simulate_training_data(self, n: int = 50):
        """
        Generates n synthetic training examples with 3 features each.
        Feature meanings:
        - skill_overlap (0–10)
        - experience_gap (0–10)
        - qualification_match (0 or 1)
        """
        X = []
        y = []
        for _ in range(n):
            skill_overlap = random.randint(0, 10)
            experience_gap = random.randint(0, 10)
            qualification_match = random.randint(0, 1)

            # Synthetic rule: more skills + qualification + low gap is better
            score = skill_overlap * 1.5 - experience_gap * 0.8 + qualification_match * 2
            label = int(score > 5)  # Threshold-based labeling

            X.append([skill_overlap, experience_gap, qualification_match])
            y.append(label)

        return X, y
