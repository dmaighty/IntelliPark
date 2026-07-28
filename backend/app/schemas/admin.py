from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ParkingLevelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parking_lot_id: int
    level_number: int
    name: str
    camera_feed_url: str | None
    spot_count: int = 0


class ParkingLevelDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parking_lot_id: int
    level_number: int
    name: str
    camera_feed_url: str | None
    defined_spots: list[list[list[float]]] | None = None
    spot_count: int = 0


class ParkingLotAdminOut(BaseModel):
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
    levels: list[ParkingLevelOut] = []


class ParkingLotCreateIn(BaseModel):
    name: str
    lot_type: str = "garage"
    address: str
    latitude: float | None = None
    longitude: float | None = None
    rating: float | None = None
    rate_per_hour: str | None = None
    details: str | None = None
    schedule: str | None = None
    spots_open: int | None = None
    total_spaces: int = 0
    camera_feed_url: str | None = None


class ParkingLotUpdateIn(BaseModel):
    name: str | None = None
    lot_type: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    rating: float | None = None
    rate_per_hour: str | None = None
    details: str | None = None
    schedule: str | None = None
    spots_open: int | None = None
    total_spaces: int | None = None


class ParkingLevelCreateIn(BaseModel):
    level_number: int
    name: str
    camera_feed_url: str | None = None


class ParkingLevelUpdateIn(BaseModel):
    level_number: int | None = None
    name: str | None = None
    camera_feed_url: str | None = None


class DefinedSpotsIn(BaseModel):
    spots: list[list[list[float]]] = Field(default_factory=list)
