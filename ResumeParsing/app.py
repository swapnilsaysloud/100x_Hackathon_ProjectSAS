from flask import Flask
from flask_cors import CORS
from flasgger import Swagger
from extract_resume import resume_extractor_bp

def create_app():
    app = Flask(__name__)
    CORS(app)
    Swagger(app)

    @app.route("/")
    def home():
        return "backend is running!"
    
    app.register_blueprint(resume_extractor_bp, url_prefix="/")
    return app

app = create_app()
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5015, debug=True)