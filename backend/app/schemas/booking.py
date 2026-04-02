from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ParkingSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    driver_id: int
    vehicle_id: int
    spot_id: int
    start_time: datetime
    end_time: datetime | None
    fee_amount: Decimal | None


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    amount: Decimal
    payment_method: str
    payment_status: str
    paid_at: datetime
