from .job import router as job_router
from .search import router as search_router
from .features import router as features_router
from .rank import router as rank_router
from .feedback import router as feedback_router

all_routers = [
    job_router,
    search_router,
    features_router,
    rank_router,
    feedback_router,
]
