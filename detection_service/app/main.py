from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.detector import get_model
from app.hybrid_detector import get_hybrid_model
from app.routes import health, hybrid_prediction, prediction


@asynccontextmanager
async def lifespan(app: FastAPI):
    import os

    if os.environ.get("SKIP_MODEL_WARMUP", "").lower() not in ("1", "true", "yes"):
        get_model()
        get_hybrid_model()
    yield


app = FastAPI(title="Detection Service", lifespan=lifespan)
app.include_router(health.router, prefix="/api")
app.include_router(prediction.router, prefix="/api")
app.include_router(hybrid_prediction.router, prefix="/api")


@app.get("/")
def root():
    return {"service": "detection-service", "docs": "/docs"}
