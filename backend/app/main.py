import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import (
    admin,
    admins,
    auth,
    drivers,
    garage_demo,
    health,
    lots,
    parking,
    parking_chat,
    prediction,
    users,
    vehicle,
)

ADMIN_DASHBOARD_ORIGIN = os.environ.get(
    "ADMIN_DASHBOARD_ORIGIN",
    "http://localhost:5173",
)

app = FastAPI(title="IntelliPark API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ADMIN_DASHBOARD_ORIGIN, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(drivers.router, prefix="/api")
app.include_router(admins.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(lots.router, prefix="/api")
app.include_router(parking.router, prefix="/api")
app.include_router(vehicle.router, prefix="/api")
app.include_router(garage_demo.router, prefix="/api")
app.include_router(prediction.router, prefix="/api")
app.include_router(parking_chat.router, prefix="/api")


@app.get("/")
def root():
    return {"service": "IntelliPark API"}
