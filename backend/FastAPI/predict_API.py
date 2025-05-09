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
    pickup_longitude: float
    pickup_latitude: float
    dropoff_longitude: float
    dropoff_latitude: float
    # New optional parameter for client-provided demand data
    current_demand: float = None

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

# New function: estimate demand based on time and location
async def estimate_demand(latitude, longitude, dt):
    """Estimate demand based on time and location"""
    hour = dt.hour
    day = dt.weekday()
    
    # Time-based factors
    is_morning_rush = 1 if (hour >= 7 and hour <= 9 and day < 5) else 0
    is_evening_rush = 1 if (hour >= 17 and hour <= 19 and day < 5) else 0
    is_weekend_night = 1 if ((hour >= 22 or hour <= 3) and (day >= 5)) else 0
    
    return {
        "is_morning_rush": is_morning_rush,
        "is_evening_rush": is_evening_rush, 
        "is_weekend_night": is_weekend_night
    }

@app.post("/predict")
async def predict_fare(ride: RideRequest):
    if model is None:
        # Fallback calculation if model isn't loaded
        # [Your existing fallback code]
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
        
        # Get demand factors
        demand_data = await estimate_demand(ride.pickup_latitude, ride.pickup_longitude, dt)
        
        # Prepare features for model - including demand features
        features = np.array([
            distance,
            hour,
            day,
            month,
            demand_data["is_morning_rush"],
            demand_data["is_evening_rush"],
            demand_data["is_weekend_night"]
        ]).reshape(1, -1)
        
        # Make prediction
        prediction = model.predict(features)
        
        # Calculate the implied surge factor for transparency
        base_fare = 3.0 + (distance * 1.5) + (distance * 0.2)
        surge_factor = max(1.0, prediction[0] / base_fare)
        
        return {
            "status": "success",
            "predicted_fare": float(max(3.0, prediction[0])),
            "distance_km": distance,
            "demand_factors": demand_data,
            "surge_factor": float(surge_factor)
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