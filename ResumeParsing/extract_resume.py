from flask import Blueprint, request, jsonify
import json 
import os
from ResumeAgent import ResumeAgent
import gc
import time
from uuid import uuid4  
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

resume_extractor_bp = Blueprint("resume_extracter", __name__)

@resume_extractor_bp.route("/extract_resume", methods=["POST"])
def extract_resume():
    start = time.time()
    print(f"⚙️  Starting resume extraction...")
    pdf_file = request.files.get("resume_pdf")

    if not pdf_file:
        print("❌ No PDF file provided.")
        return jsonify({"error": "No PDF file provided"}), 400
    
    try:
        filename = f"{uuid4().hex}.pdf"  # Generate a unique filename
        temp_pdf_path = os.path.join("/tmp", filename)
        pdf_file.save(temp_pdf_path)
    except Exception as e:
        print("❌ Error saving the PDF file.", e)
        return jsonify({"error": "Error saving the PDF file"}), 500

    try:
        resumeAgent = ResumeAgent(
            apiKey=os.environ.get("GEMINI_API_KEY"),
            modelName=None,
            systemPrompt=None,
            pdf_path=temp_pdf_path
        )
        output = resumeAgent.getJsonOutput()
        resumeAgent.sendToMongo()

        output = json.loads(json.dumps(output, default=str))


        resumeAgent.deleteAgent()

        return jsonify({'resume_entites': output}), 200
    except Exception as e:
        print("❌ Error processing the resume.", e)
        return jsonify({"error": "Internal error while processing the text"}), 500
    finally:
        end = time.time()
        print(f"✅ Resume extraction completed in {end - start:.2f}s")
        try:
            if resumeAgent: del resumeAgent
            if start: del start
            if end: del end
            if output: del output
        except Exception:
            pass
        gc.collect()









