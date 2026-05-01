from pydantic import BaseModel, ConfigDict, Field


class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    license_plate: str
    make: str | None
    model: str | None
    color: str | None
    year: str | None
    title: str | None
    color_id: str | None
    image_url: str | None
    parked_latitude: float | None
    parked_longitude: float | None


class VehicleCreateIn(BaseModel):
    license_plate: str = Field(..., min_length=1, max_length=20)
    make: str | None = None
    model: str | None = None
    color: str | None = None
    year: str | None = None
    title: str | None = None
    color_id: str | None = None
    image_url: str | None = None
    parked_latitude: float | None = None
    parked_longitude: float | None = None
