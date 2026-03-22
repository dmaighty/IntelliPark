# SmartPark: Real-Time Vision & Predictive Analytics
Vuppalapati-Chandra Sp26-1

Reza Aghayari  (reza.aghayari@sjsu.edu)

Sarah Liang (sarah.liang@sjsu.edu)

Ripandeep Singh (ripandeep.singh@sjsu.edu)

Quan David Mai (quan.mai@sjsu.edu)


# Google Drive Folder
This folder contains all technical documents and system diagrams for the SmartPark project.

[https://drive.google.com/drive/u/1/folders/1vGqu0myTUq3g5fES4r__yZVMtbU_AJmL](https://drive.google.com/drive/u/1/folders/1vGqu0myTUq3g5fES4r__yZVMtbU_AJmL))


# IntelliPark - Install and Run

## Backend (Python FastAPI)

1. cd Backend

2. Creat virtual env if you want (for git: source venv/Scripts/activate)
```bash
python -m venv venv
source venv/bin/activate
```

3. pip install -r requirements.txt

```bash
pip install -r requirements.txt
```

4. uvicorn app.main:app --reload

```bash
uvicorn app.main:app --reload
```

API runs at http://localhost:8000


===============================
# IntelliPark Database Setup Guide
===============================

This project uses PostgreSQL with SQLAlchemy and Alembic for database management.

Follow the steps below to set up the database locally and run migrations.

--------------------------------
1. Install Dependencies
--------------------------------

Make sure you are inside the project root directory, then run:

pip install -r requirements.txt


--------------------------------
2. Create PostgreSQL Database
--------------------------------

Using pgAdmin or terminal, create a database:

CREATE DATABASE intellipark_db;


--------------------------------
3. Create .env File
--------------------------------

In the root directory of the project, create a file named:

.env

Add the following line:

DATABASE_URL=postgresql+psycopg2://postgres:PASSWORD@localhost:5432/intellipark_db

Replace PASSWORD with your PostgreSQL password.


--------------------------------
4. Run Database Migrations
--------------------------------

Run the following command:

alembic upgrade head

This will automatically create all required tables.


--------------------------------
5. Verify Tables
--------------------------------

Open pgAdmin and navigate to:

Databases → intellipark_db → Schemas → public → Tables

You should see:

- users
- drivers
- admins
- parking_lots
- parking_levels
- parking_spots
- vehicles
- reservations
- parking_sessions
- payments
- alembic_version


--------------------------------
6. Important Notes
--------------------------------

- Do NOT create tables manually in pgAdmin
- Always use Alembic for schema changes
- Do NOT commit .env file to GitHub
- Make sure PostgreSQL is running before migrations


--------------------------------
7. Updating Database Schema
--------------------------------

If you modify models, run:

alembic revision --autogenerate -m "describe your change"
alembic upgrade head


--------------------------------
8. Test Database Connection
--------------------------------

You can test the connection using this Python script:

from sqlalchemy import create_engine, text
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print("Database connection works:", result.scalar())


--------------------------------
End of Setup Guide
--------------------------------





# Parking Detection Model (Jupyter Notebook)

This notebook contains the development, training, and evaluation of our parking space detection model, including dataset preprocessing, model architecture, and performance metrics.

[View Parking Detection Notebook](https://colab.research.google.com/drive/1k_aHyPhQQfMorV0jAzepQrlmu0oekT_s?usp=drive_link)

> Note: Need access to the shared google drive
