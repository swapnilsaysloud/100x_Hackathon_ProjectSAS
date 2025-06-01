import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class GeminiClient:
    def __init__(self):
        api_key = os.getenv("GEMINI_API")
        if not api_key:
            raise ValueError("Missing GEMINI_API key in environment.")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-pro")

    def complete(self, prompt: str) -> str:
        response = self.model.generate_content(prompt)
        return response.text
