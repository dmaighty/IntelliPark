from sqlalchemy import select

from app.database.connection import SessionLocal
from app.db.models.parking import ParkingLevel, ParkingLot, ParkingSpot

STATUS_MAP = {"open": "available", "occupied": "occupied"}

GARAGES = [
    {
        "name": "South Garage",
        "address": "330 S 7th St, San Jose, CA",
        "latitude": 37.3328,
        "longitude": -121.8806,
        "rating": 4.6,
        "ratePerHour": "$4/hr",
        "spotsOpen": 42,
        "details": (
            "Student-friendly garage close to the south side of campus. "
            "Covered parking with elevator access."
        ),
        "schedule": "Mon-Fri 6:00 AM - 11:00 PM, Sat-Sun 8:00 AM - 10:00 PM",
        "levels": [
            {
                "name": "Level 1",
                "layout": ["open", "occupied", "open", "occupied", "open", "open"],
            },
            {
                "name": "Level 2",
                "layout": ["occupied", "occupied", "open", "open", "occupied", "open"],
            },
            {
                "name": "Level 3",
                "layout": ["open", "open", "open", "occupied", "occupied", "open"],
            },
        ],
        "peakTimes": [
            {"label": "8AM", "value": 85},
            {"label": "10AM", "value": 95},
            {"label": "12PM", "value": 78},
            {"label": "3PM", "value": 66},
            {"label": "6PM", "value": 58},
        ],
    },
    {
        "name": "West Garage",
        "address": "355 S 4th St, San Jose, CA",
        "latitude": 37.3342,
        "longitude": -121.8851,
        "rating": 4.4,
        "ratePerHour": "$5/hr",
        "spotsOpen": 18,
        "details": (
            "Close to downtown and west campus buildings. "
            "Good for short stays and events."
        ),
        "schedule": "Daily 6:00 AM - 12:00 AM",
        "levels": [
            {
                "name": "Level 1",
                "layout": [
                    "occupied",
                    "occupied",
                    "open",
                    "occupied",
                    "open",
                    "occupied",
                ],
            },
            {
                "name": "Level 2",
                "layout": [
                    "open",
                    "occupied",
                    "open",
                    "open",
                    "occupied",
                    "occupied",
                ],
            },
            {
                "name": "Level 3",
                "layout": [
                    "occupied",
                    "open",
                    "occupied",
                    "open",
                    "open",
                    "occupied",
                ],
            },
        ],
        "peakTimes": [
            {"label": "8AM", "value": 72},
            {"label": "10AM", "value": 88},
            {"label": "12PM", "value": 81},
            {"label": "3PM", "value": 69},
            {"label": "6PM", "value": 54},
        ],
    },
    {
        "name": "North Garage",
        "address": "225 E Santa Clara St, San Jose, CA",
        "latitude": 37.3376,
        "longitude": -121.8831,
        "rating": 4.7,
        "ratePerHour": "$6/hr",
        "spotsOpen": 9,
        "details": (
            "Premium garage with quick access to the north side of SJSU "
            "and Santa Clara Street."
        ),
        "schedule": "Daily 24 hours",
        "levels": [
            {
                "name": "Level 1",
                "layout": [
                    "occupied",
                    "occupied",
                    "occupied",
                    "open",
                    "occupied",
                    "occupied",
                ],
            },
            {
                "name": "Level 2",
                "layout": [
                    "occupied",
                    "open",
                    "occupied",
                    "occupied",
                    "open",
                    "occupied",
                ],
            },
            {
                "name": "Level 3",
                "layout": [
                    "open",
                    "occupied",
                    "open",
                    "occupied",
                    "occupied",
                    "open",
                ],
            },
        ],
        "peakTimes": [
            {"label": "8AM", "value": 92},
            {"label": "10AM", "value": 98},
            {"label": "12PM", "value": 90},
            {"label": "3PM", "value": 76},
            {"label": "6PM", "value": 60},
        ],
    },
    {
        "name": "10th Street Garage",
        "address": "127 S 10th St, San Jose, CA",
        "latitude": 37.3348,
        "longitude": -121.8738,
        "rating": 4.3,
        "ratePerHour": "$3/hr",
        "spotsOpen": 27,
        "details": (
            "Budget-friendly parking with easy entry and exit near east campus."
        ),
        "schedule": "Daily 7:00 AM - 11:00 PM",
        "levels": [
            {
                "name": "Level 1",
                "layout": [
                    "open",
                    "open",
                    "occupied",
                    "open",
                    "occupied",
                    "open",
                ],
            },
            {
                "name": "Level 2",
                "layout": [
                    "occupied",
                    "open",
                    "open",
                    "open",
                    "occupied",
                    "open",
                ],
            },
            {
                "name": "Level 3",
                "layout": [
                    "open",
                    "occupied",
                    "open",
                    "occupied",
                    "open",
                    "open",
                ],
            },
        ],
        "peakTimes": [
            {"label": "8AM", "value": 58},
            {"label": "10AM", "value": 71},
            {"label": "12PM", "value": 68},
            {"label": "3PM", "value": 52},
            {"label": "6PM", "value": 43},
        ],
    },
    {
        "name": "San Pedro Square Garage",
        "address": "45 N Market St, San Jose, CA",
        "latitude": 37.3364,
        "longitude": -121.8949,
        "rating": 4.8,
        "ratePerHour": "$7/hr",
        "spotsOpen": 31,
        "details": (
            "Popular downtown option with lots of dining nearby. "
            "Best for mixed campus and downtown visits."
        ),
        "schedule": "Daily 24 hours",
        "levels": [
            {
                "name": "Level 1",
                "layout": [
                    "occupied",
                    "open",
                    "open",
                    "occupied",
                    "open",
                    "occupied",
                ],
            },
            {
                "name": "Level 2",
                "layout": [
                    "open",
                    "open",
                    "occupied",
                    "open",
                    "occupied",
                    "open",
                ],
            },
            {
                "name": "Level 3",
                "layout": [
                    "occupied",
                    "open",
                    "occupied",
                    "open",
                    "open",
                    "open",
                ],
            },
        ],
        "peakTimes": [
            {"label": "8AM", "value": 61},
            {"label": "10AM", "value": 74},
            {"label": "12PM", "value": 84},
            {"label": "3PM", "value": 79},
            {"label": "6PM", "value": 91},
        ],
    },
]


def seed():
    db = SessionLocal()
    try:
        inserted = 0
        for g in GARAGES:
            existing = db.scalar(select(ParkingLot).where(ParkingLot.name == g["name"]))
            if existing:
                continue
            total_spaces = sum(len(lev["layout"]) for lev in g["levels"])
            lot = ParkingLot(
                name=g["name"],
                lot_type="garage",
                address=g["address"],
                latitude=g["latitude"],
                longitude=g["longitude"],
                rating=g["rating"],
                rate_per_hour=g["ratePerHour"],
                details=g["details"],
                schedule=g["schedule"],
                peak_times=g["peakTimes"],
                spots_open=g["spotsOpen"],
                total_spaces=total_spaces,
            )
            db.add(lot)
            db.flush()
            for level_idx, lev in enumerate(g["levels"]):
                level = ParkingLevel(
                    parking_lot_id=lot.id,
                    level_number=level_idx + 1,
                    name=lev["name"],
                )
                db.add(level)
                db.flush()
                for spot_idx, cell in enumerate(lev["layout"]):
                    status = STATUS_MAP.get(cell, "available")
                    spot = ParkingSpot(
                        parking_lot_id=lot.id,
                        level_id=level.id,
                        spot_number=f"{level_idx + 1}-{spot_idx + 1}",
                        spot_type="regular",
                        status=status,
                    )
                    db.add(spot)
            inserted += 1
        db.commit()
        print(f"Seeded {inserted} garage(s). Skipped lots that already exist by name.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
