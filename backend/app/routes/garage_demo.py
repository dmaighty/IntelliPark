# this is for demo only, does not store in database, gets data from google colab running the model


from fastapi import APIRouter
import time

router = APIRouter(prefix="/garage-demo", tags=["Garage Demo"])

latest_parking_status = {
    "running": False,
    "message": "Model is not running",
    "occupied": 0,
    "free": 0,
    "total": 0,
    "occupancy_rate": 0,
    "spaces": [],
    "updated_at": None,
}

last_update_time = 0
TIMEOUT_SECONDS = 10


@router.get("/status")
def get_garage_demo_status():
    if time.time() - last_update_time > TIMEOUT_SECONDS:
        return {
            **latest_parking_status,
            "running": False,
            "message": "Model is not running",
        }

    return latest_parking_status


@router.post("/status")
def update_garage_demo_status(status: dict):
    global latest_parking_status, last_update_time

    latest_parking_status = status
    latest_parking_status["running"] = True
    latest_parking_status["message"] = "Model is running"
    last_update_time = time.time()

    return {"success": True}