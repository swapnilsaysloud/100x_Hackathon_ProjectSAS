import json
import os
from google import genai
from Promptvariable import SYSTEM_PROMPT
from pdf2image import convert_from_path
from PIL import Image
from pymongo import MongoClient

class ResumeAgent:
    def __init__(self, apiKey, modelName, systemPrompt,pdf_path=None):
        modelName = os.environ.get("GEMINI_MODEL_NAME")
        systemPrompt = SYSTEM_PROMPT

        if not systemPrompt:
            raise ValueError("System prompt not found.")
        if not apiKey:
            raise ValueError("API key not found.")
        if not modelName:
            raise ValueError("Model name not found.")
        if not pdf_path:
            raise ValueError("PDF file not found.")
        
        self.apikey = apiKey
        self.modelName = modelName
        self.systemPrompt = systemPrompt
        self.response = None
        self.jsonOutput = None
        self.model = None
        self.pdf = pdf_path
        self.images = None
    def getClient(self):
        if not self.model:
            try:
                self.model = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            except Exception as e:
                raise ValueError(f"Failed to initialize model: {e}")
    
    def parseRespone(self):
        if not self.response:
            raise ValueError("No response found.")
        try:
            startIndex = self.response.index('{')
            endIndex = self.response.rindex('}') + 1
            jsonString = self.response[startIndex:endIndex]
            jsonOutput = json.loads(jsonString)
        except (ValueError, json.JSONDecodeError) as e:
            raise ValueError(f"Failed to parse JSON response: {e}")
        if not isinstance(jsonOutput, dict):
            raise ValueError("Parsed JSON is not a dictionary.")
        return jsonOutput
    
    def getImages(self):
        images = convert_from_path(self.pdf)
        image_contents = []
        for image in images:
            # Save the image temporarily
            temp_image_path = "/tmp/temp_image.png"
            image.save(temp_image_path, "PNG")
            
            # Open the image and add it to the contents
            with open(temp_image_path, "rb") as img_file:
                img = Image.open(img_file)
                img.load()  # Load the image into memory
                image_contents.append(img)
            
        self.images = image_contents


    def getResponse(self):
        if not self.modelName:
            raise ValueError("Model name not set.")
        if not self.systemPrompt:
            raise ValueError("System prompt not set.")
        
        self.getClient()
        self.getImages()
        if not self.model:
            raise ValueError("Model not initialized.")
        try:

            response = self.model.models.generate_content(
                model=self.modelName,
                contents=self.images + [self.systemPrompt],
            )
        except Exception as e:
            raise ValueError(f"Failed to get response: {e}")

        self.response = response.text
        print(self.response)
        self.jsonOutput = self.parseRespone()

    def getJsonOutput(self):
        if not self.jsonOutput:
            for _ in range(3):
                try:
                    self.getResponse()
                    if self.jsonOutput:
                        break
                except ValueError:
                    continue
            if not self.jsonOutput:
                raise ValueError("No JSON output found.")
        return self.jsonOutput

    def deleteAgent(self):
        self.modelName = None
        self.systemPrompt = None
        self.model = None
        self.response = None
        self.jsonOutput = None
        self.apikey = None
    
    def sendToMongo(self):
        try:
            mongo_uri = os.getenv("MONGO_URI")
            mongo_db = os.getenv("MONGO_DB")
            mongo_collection = os.getenv("MONGO_COLLECTION")

            if not mongo_uri or not mongo_db or not mongo_collection:
                raise ValueError("MongoDB credentials are missing in the .env file.")

            client = MongoClient(mongo_uri)
            db = client[mongo_db]
            collection = db[mongo_collection]

            #print("📤 Sending data to MongoDB...",self.getJsonOutput())

            collection.insert_one(self.getJsonOutput())
            print(f"✅ Data successfully inserted into MongoDB")
        except Exception as e:
            print(f"❌ Error sending data to MongoDB: {e}")
        # finally:
        #     if 'client' in locals():
        #         client.close()