from pymongo.collection import Collection

class CandidateSearcher:
    def __init__(self, collection: Collection):
        self.collection = collection

    def search(self, embedding: list[float], top_k: int = 100) -> list[dict]:
        pipeline = [
            {
                "$search": {
                    "index": "default",
                    "knnBeta": {
                        "vector": embedding,
                        "path": "embedding",
                        "k": top_k
                    }
                }
            }
        ]
        return list(self.collection.aggregate(pipeline))
