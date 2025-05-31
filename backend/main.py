from fastapi import FastAPI
from api import job, search, features, rank, feedback

app = FastAPI()

app.include_router(job.router)
app.include_router(search.router)
app.include_router(features.router)
app.include_router(rank.router)
app.include_router(feedback.router)