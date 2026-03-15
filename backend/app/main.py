from fastapi import FastAPI
from app.routes import health, parking

app = FastAPI(title="IntelliPark API")
app.include_router(health.router, prefix="/api")
app.include_router(parking.router, prefix="/api")


@app.get("/")
def root():
    return {"service": "IntelliPark API"}
