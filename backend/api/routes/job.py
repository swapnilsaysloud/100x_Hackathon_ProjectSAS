from fastapi import APIRouter
from pydantic import BaseModel
from backend.core.embedder import SemanticEmbedder
from backend.core.extractor import SemanticJobExtractor
from backend.core.llm_clients.gemini_client import GeminiClient

router = APIRouter()

# Instantiate core components
embedder = SemanticEmbedder()
extractor = SemanticJobExtractor(llm_client=GeminiClient())

# --- Pydantic Models ---

class JobDescriptionRequest(BaseModel):
    text: str

class JobDescriptionResponse(BaseModel):
    extracted: dict
    standardized_query: str
    embedding: list[float]


# --- Endpoint ---

@router.post("/process-job-description", response_model=JobDescriptionResponse)
def process_job_description(req: JobDescriptionRequest):
    # 1. Extract structured fields from job description
    extracted = extractor.extract_fields(req.text)

    # 2. Build standardized query from extracted fields
    # Build candidate-style summary
    experience_str = f"{extracted['experience']} years of experience" if extracted['experience'] else "some experience"
    skills_str = ", ".join(extracted['skills']) if extracted['skills'] else "various skills"
    qual_str = ", ".join(extracted['qualifications']) if extracted['qualifications'] else "relevant qualifications"

    standardized_query = f"A candidate with {experience_str}, skilled in {skills_str}, and holding {qual_str}."


    # 3. Generate vector embedding
    embedding = embedder.encode(standardized_query)

    return JobDescriptionResponse(
        extracted=extracted,
        standardized_query=standardized_query,
        embedding=embedding
    )
