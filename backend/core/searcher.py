# backend/core/searcher.py
from pymongo.collection import Collection
from typing import List, Dict

class CandidateSearcher:
    def __init__(self, collection: Collection):
        self.collection = collection
        self.index_name = "default"  # Ensure this matches your Atlas Search index name
        self.vector_path = "embedding" # Ensure this matches the field with vectors

    def search(self, embedding: List[float], top_k: int = 100) -> List[Dict]:
        """
        Performs a vector search on MongoDB Atlas using the $vectorSearch operator.
        """
        # numCandidates should typically be greater than top_k (limit)
        # A common rule of thumb is 10 * top_k, or at least top_k + some buffer,
        # but adjust based on performance and accuracy needs.
        num_candidates = max(top_k * 2, top_k + 50) # Example logic for num_candidates

        pipeline = [
            {
                "$vectorSearch": {
                    "index": self.index_name,
                    "queryVector": embedding,
                    "path": self.vector_path,
                    "numCandidates": num_candidates,
                    "limit": top_k
                    # You can add a "filter" here if needed:
                    # "filter": { "some_field": "some_value" }
                }
            },
            {
                "$project": {
                    "embedding": 0,  # Exclude the embedding field
                    "score": {"$meta": "vectorSearchScore"}  # Get the search score
                }
            }
            # The 'limit' in $vectorSearch handles the final number of results.
            # An additional $limit stage is usually not needed unless applied after further processing.
        ]
        try:
            # For debugging:
            # import json
            # print(f"MongoDB Aggregation Pipeline ($vectorSearch): {json.dumps(pipeline, indent=2)}")
            results = list(self.collection.aggregate(pipeline))
            # print(f"Raw results from MongoDB ($vectorSearch): {results}")
            return results
        except Exception as e:
            print(f"Error during MongoDB aggregation ($vectorSearch): {e}, full error: {getattr(e, 'details', {})}")
            raise