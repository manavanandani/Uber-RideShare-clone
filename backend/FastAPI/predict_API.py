# FastAPI/predict_API.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pickle
import numpy as np
from datetime import datetime
import math
import os

app = FastAPI()

# Load the model
model_path = "xgboost_fare_model.pkl"

# Check if model exists, otherwise will be downloaded in docker
if os.path.exists(model_path):
    try:
        model = pickle.load(open(model_path, 'rb'))
    except Exception as e:
        print(f"Error loading model: {e}")
        model = None
else:
    print("Model file not found, will be downloaded in docker")
    model = None

class RideRequest(BaseModel):
    pickup_datetime: str
    passenger_count: int
    pickup_longitude: float
    pickup_latitude: float
    dropoff_longitude: float
    dropoff_latitude: float

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points on earth"""
    # Convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r

@app.post("/predict")
async def predict_fare(ride: RideRequest):
    if model is None:
        # Fallback calculation if model isn't loaded
        distance = haversine_distance(
            ride.pickup_latitude, 
            ride.pickup_longitude, 
            ride.dropoff_latitude, 
            ride.dropoff_longitude
        )
        
        # Basic fare calculation
        base_fare = 3.0
        per_km_rate = 1.5
        predicted_fare = base_fare + (distance * per_km_rate)
        
        # Add time of day factor
        try:
            dt = datetime.fromisoformat(ride.pickup_datetime.replace('Z', '+00:00'))
            hour = dt.hour
            # Higher rates during peak hours
            if (hour >= 7 and hour <= 9) or (hour >= 17 and hour <= 19):
                predicted_fare *= 1.25
            # Higher rates late night
            elif hour >= 22 or hour <= 4:
                predicted_fare *= 1.15
        except:
            pass
            
        return {
            "status": "fallback",
            "predicted_fare": round(predicted_fare, 2),
            "distance_km": round(distance, 2)
        }
        
    try:
        # Extract time features
        dt = datetime.fromisoformat(ride.pickup_datetime.replace('Z', '+00:00'))
        hour = dt.hour
        day = dt.weekday()
        month = dt.month
        
        # Calculate distance
        distance = haversine_distance(
            ride.pickup_latitude, 
            ride.pickup_longitude, 
            ride.dropoff_latitude, 
            ride.dropoff_longitude
        )
        
        # Prepare features for model
        features = np.array([
            ride.passenger_count,
            ride.pickup_longitude,
            ride.pickup_latitude,
            ride.dropoff_longitude,
            ride.dropoff_latitude,
            distance,
            hour,
            day,
            month
        ]).reshape(1, -1)
        
        # Make prediction
        prediction = model.predict(features)
        
        return {
            "status": "success",
            "predicted_fare": float(max(3.0, prediction[0])),
            "distance_km": distance
        }
    except Exception as e:
        # Fallback to basic calculation on error
        distance = haversine_distance(
            ride.pickup_latitude, 
            ride.pickup_longitude, 
            ride.dropoff_latitude, 
            ride.dropoff_longitude
        )
        predicted_fare = 3.0 + (distance * 1.5)
        
        return {
            "status": "error_fallback",
            "predicted_fare": round(predicted_fare, 2),
            "distance_km": round(distance, 2),
            "error": str(e)
        }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.get("/")
async def root():
    return {"message": "Welcome to the Taxi Fare Prediction API!"}