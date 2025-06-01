from fastapi import FastAPI
from api import job, search, features, rank, feedback

app = FastAPI()

app.include_router(job.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(features.router, prefix="/api")
app.include_router(rank.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")