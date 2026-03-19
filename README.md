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


## Frontend (React Native Expo)

1. cd Frontend

```bash
cd Frontend
```

2. npm install

```bash
npm install
```

3. npm start

```bash
npm start
```

You can start ios emulator on ur mac by pressing `i` which will run ur app.

or download the Expo app which will run SmartPark on ur phone locally by scanning the barcode.

look at Expo docs for more information.



# Parking Detection Model (Jupyter Notebook)

This notebook contains the development, training, and evaluation of our parking space detection model, including dataset preprocessing, model architecture, and performance metrics.

[View Parking Detection Notebook](https://colab.research.google.com/drive/1k_aHyPhQQfMorV0jAzepQrlmu0oekT_s?usp=drive_link)

> Note: Need access to the shared google drive