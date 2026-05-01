from sqlalchemy import select

from app.database.connection import SessionLocal
from app.db.models.booking import Vehicle
from app.db.models.parking import ParkingLevel, ParkingLot, ParkingSpot
from app.db.models.user import Driver, User
from app.security import hash_password


def get_or_create_user(db, *, full_name: str, email: str, role: str, phone: str | None):
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        user = User(
            full_name=full_name,
            email=email,
            role=role,
            password_hash=hash_password("Password@123"),
        )
        db.add(user)
        db.flush()
    if role == "driver":
        driver = db.scalar(select(Driver).where(Driver.user_id == user.id))
        if not driver:
            driver = Driver(user_id=user.id, phone=phone)
            db.add(driver)
            db.flush()
    return user


def get_or_create_lot(db, *, name: str, lot_type: str, address: str, latitude: float, total_spaces: int):
    lot = db.scalar(select(ParkingLot).where(ParkingLot.name == name))
    if not lot:
        lot = ParkingLot(
            name=name,
            lot_type=lot_type,
            address=address,
            latitude=latitude,
            total_spaces=total_spaces,
        )
        db.add(lot)
        db.flush()
    return lot


def get_or_create_level(db, *, lot_id: int, level_number: int, name: str):
    level = db.scalar(
        select(ParkingLevel).where(
            ParkingLevel.parking_lot_id == lot_id,
            ParkingLevel.level_number == level_number,
        )
    )
    if not level:
        level = ParkingLevel(
            parking_lot_id=lot_id,
            level_number=level_number,
            name=name,
        )
        db.add(level)
        db.flush()
    return level


def get_or_create_spot(
    db,
    *,
    lot_id: int,
    level_id: int | None,
    spot_number: str,
    spot_type: str,
    status: str,
):
    spot = db.scalar(
        select(ParkingSpot).where(
            ParkingSpot.parking_lot_id == lot_id,
            ParkingSpot.spot_number == spot_number,
        )
    )
    if not spot:
        spot = ParkingSpot(
            parking_lot_id=lot_id,
            level_id=level_id,
            spot_number=spot_number,
            spot_type=spot_type,
            status=status,
        )
        db.add(spot)
    return spot


def get_or_create_vehicle(
    db,
    *,
    user_id: int,
    license_plate: str,
    year: str,
    title: str,
    make: str,
    model: str,
    color: str,
    color_id: str,
    parked_latitude: float,
    parked_longitude: float,
):
    vehicle = db.scalar(select(Vehicle).where(Vehicle.license_plate == license_plate))
    if not vehicle:
        vehicle = Vehicle(
            user_id=user_id,
            license_plate=license_plate,
            year=year,
            title=title,
            make=make,
            model=model,
            color=color,
            color_id=color_id,
            parked_latitude=parked_latitude,
            parked_longitude=parked_longitude,
        )
        db.add(vehicle)
    return vehicle


def seed():
    db = SessionLocal()
    try:
        sarah = get_or_create_user(
            db,
            full_name="Sarah Liang",
            email="sarah.liang@sjsu.edu",
            role="driver",
            phone="(408) 555-1201",
        )
        reza = get_or_create_user(
            db,
            full_name="Reza Aghayari",
            email="reza.aghayari@sjsu.edu",
            role="driver",
            phone="(408) 555-1202",
        )
        ripan = get_or_create_user(
            db,
            full_name="Ripandeep Singh",
            email="ripandeep.singh@sjsu.edu",
            role="driver",
            phone="(408) 555-1203",
        )

        lot_a = get_or_create_lot(
            db,
            name="SJSU North Garage",
            lot_type="garage",
            address="10th St & San Fernando St, San Jose, CA",
            latitude=37.3354,
            total_spaces=120,
        )
        lot_b = get_or_create_lot(
            db,
            name="Downtown Open Lot",
            lot_type="open_lot",
            address="2nd St & Santa Clara St, San Jose, CA",
            latitude=37.3372,
            total_spaces=60,
        )

        level_g = get_or_create_level(db, lot_id=lot_a.id, level_number=0, name="Ground")
        level_1 = get_or_create_level(db, lot_id=lot_a.id, level_number=1, name="Level 1")

        for i in range(1, 11):
            get_or_create_spot(
                db,
                lot_id=lot_a.id,
                level_id=level_g.id if i <= 5 else level_1.id,
                spot_number=f"A-{i:03d}",
                spot_type="regular",
                status="available" if i % 4 else "occupied",
            )

        for i in range(1, 9):
            get_or_create_spot(
                db,
                lot_id=lot_b.id,
                level_id=None,
                spot_number=f"B-{i:03d}",
                spot_type="regular",
                status="available" if i % 3 else "occupied",
            )

        get_or_create_vehicle(
            db,
            user_id=sarah.id,
            license_plate="8SAR001",
            year="2024",
            title="Toyota Camry",
            make="Toyota",
            model="Camry",
            color="White",
            color_id="white",
            parked_latitude=37.3356,
            parked_longitude=-121.8810,
        )
        get_or_create_vehicle(
            db,
            user_id=reza.id,
            license_plate="8REZ002",
            year="2023",
            title="Honda Civic",
            make="Honda",
            model="Civic",
            color="Black",
            color_id="black",
            parked_latitude=37.3364,
            parked_longitude=-121.8789,
        )
        get_or_create_vehicle(
            db,
            user_id=ripan.id,
            license_plate="8RIP003",
            year="2022",
            title="Tesla Model 3",
            make="Tesla",
            model="Model 3",
            color="Blue",
            color_id="blue",
            parked_latitude=37.3348,
            parked_longitude=-121.8832,
        )

        db.commit()
        print("Mock data seeded successfully.")
        print("Default password for seeded users: Password@123")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
