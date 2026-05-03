from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.detector import get_model
from app.routes import health, prediction


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm-load weights so first /predict is fast; set SKIP_MODEL_WARMUP=1 to skip.
    import os

    if os.environ.get("SKIP_MODEL_WARMUP", "").lower() not in ("1", "true", "yes"):
        get_model()
    yield


app = FastAPI(title="Detection Service", lifespan=lifespan)
app.include_router(health.router, prefix="/api")
app.include_router(prediction.router, prefix="/api")


@app.get("/")
def root():
    return {"service": "detection-service", "docs": "/docs"}
