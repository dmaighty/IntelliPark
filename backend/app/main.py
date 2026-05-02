from fastapi import FastAPI
from app.routes import admins, auth, drivers, health, lots, parking, users, vehicle

app = FastAPI(title="IntelliPark API")
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(drivers.router, prefix="/api")
app.include_router(admins.router, prefix="/api")
app.include_router(lots.router, prefix="/api")
app.include_router(parking.router, prefix="/api")
app.include_router(vehicle.router, prefix="/api")


@app.get("/")
def root():
    return {"service": "IntelliPark API"}
