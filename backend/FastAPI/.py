import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import pickle
from datetime import datetime
import math

# Load the dataset
df = pd.read_csv('uber.csv')

# Basic cleaning
df = df.dropna()
df = df[(df['fare_amount'] > 0) & (df['fare_amount'] < 200)]  # Remove outliers

# Convert datetime
df['pickup_datetime'] = pd.to_datetime(df['pickup_datetime'])

# Feature engineering - adding demand features
df['hour'] = df['pickup_datetime'].dt.hour
df['day_of_week'] = df['pickup_datetime'].dt.dayofweek
df['month'] = df['pickup_datetime'].dt.month

# New: Create time-based demand proxies
df['is_morning_rush'] = ((df['hour'] >= 7) & (df['hour'] <= 9) & (df['day_of_week'] >= 0) & (df['day_of_week'] <= 4)).astype(int)
df['is_evening_rush'] = ((df['hour'] >= 17) & (df['hour'] <= 19) & (df['day_of_week'] >= 0) & (df['day_of_week'] <= 4)).astype(int)
df['is_weekend_night'] = ((df['hour'] >= 22) | (df['hour'] <= 3)) & ((df['day_of_week'] == 5) | (df['day_of_week'] == 6)).astype(int)

# New: Calculate location density (as a proxy for demand)
# Group by location grid and count rides, then merge back
df['pickup_grid'] = (
    (df['pickup_latitude'] * 100).astype(int).astype(str) + '_' +
    (df['pickup_longitude'] * 100).astype(int).astype(str)
)
location_counts = df.groupby('pickup_grid').size().reset_index(name='location_density')
df = pd.merge(df, location_counts, on='pickup_grid', how='left')

# Calculate distance using Haversine formula
def haversine_distance(lat1, lon1, lat2, lon2):
    # [Your existing distance calculation function]
    R = 6371  # Earth radius in kilometers
    
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    distance = R * c
    
    return distance

# Apply distance calculation
df['distance_km'] = df.apply(
    lambda row: haversine_distance(
        row['pickup_latitude'], row['pickup_longitude'],
        row['dropoff_latitude'], row['dropoff_longitude']
    ),
    axis=1
)

# Remove rows with unrealistic distances
df = df[(df['distance_km'] > 0.1) & (df['distance_km'] < 100)]

# Prepare features - including new demand features
features = [
    'passenger_count', 
    'distance_km', 
    'hour', 
    'day_of_week', 
    'month', 
    'is_morning_rush', 
    'is_evening_rush', 
    'is_weekend_night',
    'location_density'
]
X = df[features]
y = df['fare_amount']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train XGBoost model
model = xgb.XGBRegressor(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=5,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)
model.fit(X_train, y_train)

# Save the model
with open('xgboost_fare_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("Model trained and saved as xgboost_fare_model.pkl")

# Optional: Feature importance analysis
feature_importance = model.feature_importances_
features_df = pd.DataFrame({
    'Feature': features,
    'Importance': feature_importance
}).sort_values(by='Importance', ascending=False)
print("\nFeature Importance:")
print(features_df)