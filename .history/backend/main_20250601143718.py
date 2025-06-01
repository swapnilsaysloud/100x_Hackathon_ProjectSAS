from fastapi import FastAPI
from backend.api.routes import all_routers

app = FastAPI()

for router in all_routers:
    app.include_router(router, prefix="/api")
