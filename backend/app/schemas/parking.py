from typing import Any

from pydantic import BaseModel, ConfigDict


class ParkingLotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    lot_type: str
    address: str
    latitude: float | None
    longitude: float | None
    rating: float | None
    rate_per_hour: str | None
    details: str | None
    schedule: str | None
    peak_times: list[dict[str, Any]] | None
    spots_open: int | None
    total_spaces: int


class ParkingSpotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parking_lot_id: int
    level_id: int | None
    spot_number: str
    spot_type: str
    status: str


class NearbyLotOut(ParkingLotOut):
    distance_score: float
