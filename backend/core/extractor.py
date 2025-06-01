from backend.core.llm_clients.gemini_client import GeminiClient
from typing import Dict, Any
from sentence_transformers import SentenceTransformer
import re

class SemanticJobExtractor:
    def __init__(self, llm_client=None):
        """
        llm_client should have a .complete(prompt: str) -> str interface.
        This allows plugging in OpenAI, Anthropic, or other models.
        """
        self.llm_client = llm_client or GeminiClient()
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")

    def extract_fields(self, job_description: str) -> Dict[str, Any]:
        prompt = f"""
        Extract the following from this job description:
        1. Required Skills (as a list of strings)
        2. Minimum Experience (in years, integer)
        3. Required Qualifications (as a list of degrees or certifications)

        Job Description:
        \"\"\"{job_description}\"\"\"
        
        Return the result as a JSON object with keys: skills, experience, qualifications. Don't wrap it in ```.
        """

        if self.llm_client:
            response = self.llm_client.complete(prompt)
            return self._safe_parse_json(response)

        # Fallback simple extractor if LLM is unavailable
        return self._simple_extract(job_description)

    def _simple_extract(self, job_description: str) -> Dict[str, Any]:
        # Basic regex fallback for demo or offline environments
        skills = re.findall(r'\b(Python|Java|SQL|AWS|Docker|ML|AI)\b', job_description, re.I)
        experience = re.search(r'(\d+)\+?\s+years? of experience', job_description, re.I)
        qualifications = re.findall(r'\b(B\.?Sc|M\.?Sc|Ph\.?D|Bachelor|Master)\b', job_description, re.I)

        return {
            "skills": list(set(skills)),
            "experience": int(experience.group(1)) if experience else 0,
            "qualifications": list(set(qualifications))
        }

    def vectorize_job(self, job_fields: Dict[str, Any]) -> list[float]:
        """
        Turns structured job fields into a single text and vectorizes it.
        """
        job_text = (
            "Skills: " + ", ".join(job_fields.get("skills", [])) + ". " +
            f"Experience: {job_fields.get('experience', 0)} years. " +
            "Qualifications: " + ", ".join(job_fields.get("qualifications", [])) + "."
        )
        return self.embedder.encode(job_text).tolist()

    def _safe_parse_json(self, text: str) -> Dict[str, Any]:
        try:
            import json
            return json.loads(text)
        except Exception:
            return {"skills": [], "experience": 0, "qualifications": []}
