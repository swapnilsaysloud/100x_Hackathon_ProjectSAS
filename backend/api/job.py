from fastapi import APIRouter
from pydantic import BaseModel
from app.core.embedder import SemanticEmbedder

router = APIRouter()

embedder = SemanticEmbedder()

class JobDescriptionRequest(BaseModel):
    text: str

class JobDescriptionResponse(BaseModel):
    extracted: dict
    standardized_query: str
    embedding: list[float]

@router.post("/process-job-description", response_model=JobDescriptionResponse)
def process_job_description(req: JobDescriptionRequest):
    # Placeholder for NLP extraction
    extracted = {
        "skills": ["Python", "ML", "AWS"],
        "experience": 5,
        "qualifications": ["BSc Computer Science"]
    }
    standardized_query = "Looking for a candidate with experience in Python, ML, AWS and a BSc in CS."
    embedding = embedder.encode(standardized_query)

    return JobDescriptionResponse(
        extracted=extracted,
        standardized_query=standardized_query,
        embedding=embedding
    )