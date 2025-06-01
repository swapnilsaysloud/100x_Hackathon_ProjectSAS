from fastapi import APIRouter
from pydantic import BaseModel
from backend.core.extractor import JobFeatureExtractor

router = APIRouter()
extractor = JobFeatureExtractor()

class JobDescriptionRequest(BaseModel):
    text: str

class JobFeatureResponse(BaseModel):
    extracted: dict

@router.post("/extract-job-features", response_model=JobFeatureResponse)
def extract_job_features(req: JobDescriptionRequest):
    extracted = extractor.extract(req.text)
    return JobFeatureResponse(extracted=extracted)
