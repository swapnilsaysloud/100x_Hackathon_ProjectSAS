from sentence_transformers import SentenceTransformer

class SemanticEmbedder:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)

    def encode(self, text: str) -> list:
        return self.model.encode(text).tolist()

    def encode_batch(self, texts: list[str]) -> list[list[float]]:
        return self.model.encode(texts).tolist()
