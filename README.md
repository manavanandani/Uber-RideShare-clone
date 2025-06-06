# Uber Ride Share
## Overview

This project is a comprehensive ride-sharing application backend built with Node.js. It provides a full simulation of an Uber-like service, with features for customers to request rides, drivers to accept and complete rides, and administrators to oversee the system.

## Architecture

The application is built on a modern microservices architecture using the following technologies:

- **Express.js**: Web framework for REST API endpoints
- **MongoDB**: Primary database for storing user data, rides, and billing information
- **Redis**: For caching frequently accessed data to improve performance
- **Kafka**: For asynchronous event-driven communication between services
- **FastAPI (Python)**: For ML-based fare prediction 

## Features

- **User Management**
  - Customer, driver, and admin roles
  - Authentication using JWT
  - Profile management
  - Media uploads

- **Ride Management**
  - Request rides
  - Accept/reject rides
  - Start/complete rides
  - Ride history

- **Dynamic Pricing**
  - ML-based fare prediction
  - Surge pricing based on demand
  - Integration with Python ML model via FastAPI

- **Billing System**
  - Automated billing upon ride completion
  - Payment processing
  - Billing history

- **Real-time Tracking**
  - Driver location updates
  - Ride status updates

- **Performance Optimizations**
  - Redis caching
  - Kafka message batching
  - Geospatial queries for nearby rides/drivers

## Project Structure

```
backend/
├── FastAPI/                    # Python ML model for fare prediction
│   ├── ML_train.py             # ML model training script
│   ├── predict_API.py          # FastAPI endpoints for fare prediction
│   └── requirements.txt        # Python dependencies
├── config/                     # Configuration files
│   ├── db.js                   # MongoDB connection
│   ├── kafka.js                # Kafka configuration
│   └── redis.js                # Redis configuration
├── controllers/                # API endpoint handlers
├── middleware/                 # Express middleware
├── models/                     # MongoDB models
├── routes/                     # API routes
├── services/                   # Business logic services
├── utils/                      # Utility functions
├── .env                        # Environment variables
├── Dockerfile                  # Docker configuration
├── app.js                      # Express app setup
├── package.json                # Node.js dependencies
└── server.js                   # Server entry point
```

## Installation

### Prerequisites

- Node.js v18 or higher
- MongoDB
- Redis
- Kafka
- Python 3.9 (for ML component)

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Set up Python environment for ML component:
   ```bash
   cd backend/FastAPI
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the root directory with the following variables:
   ```
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/uber_simulation

   # JWT Configuration
   JWT_SECRET=your_secret_key
   JWT_EXPIRES_IN=2h

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # Kafka Configuration
   KAFKA_BROKER=localhost:9092
   ```

## Running the Application

### Development Mode

1. Start the Node.js backend:
   ```bash
   npm run dev
   ```

2. Start the ML service:
   ```bash
   cd backend/FastAPI
   uvicorn predict_API:app --host 0.0.0.0 --port 8000
   ```

### Using Docker

The project includes Docker configuration for containerized deployment:

```bash
# Run the entire application stack
docker-compose up --build
```

## API Documentation

The API follows RESTful principles and provides the following main endpoints:

### Authentication

- `POST /api/auth/customer/register` - Register a new customer
- `POST /api/auth/driver/register` - Register a new driver
- `POST /api/auth/customer/login` - Customer login
- `POST /api/auth/driver/login` - Driver login
- `POST /api/auth/admin/login` - Admin login

### Customers

- `GET /api/customers` - Get all customers (admin only)
- `GET /api/customers/:customer_id` - Get customer details
- `PATCH /api/customers/:customer_id` - Update customer profile
- `DELETE /api/customers/delete/:customer_id` - Delete customer account

### Drivers

- `GET /api/drivers` - Get all drivers (admin only)
- `GET /api/drivers/available` - Get available drivers
- `GET /api/drivers/:driver_id` - Get driver details
- `PATCH /api/drivers/:driver_id/status` - Update driver status
- `DELETE /api/drivers/delete/:driver_id` - Delete driver account

### Rides

- `POST /api/rides` - Create a new ride request
- `GET /api/rides/customer/:customer_id` - Get customer rides
- `GET /api/rides/driver/:driver_id` - Get driver rides
- `GET /api/rides/nearby` - Get nearby ride requests (for drivers)
- `PATCH /api/rides/:ride_id/accept` - Accept a ride
- `PATCH /api/rides/:ride_id/start` - Start a ride
- `PATCH /api/rides/:ride_id/complete` - Complete a ride
- `PATCH /api/rides/:ride_id/cancel-customer` - Cancel a ride (customer)
- `PATCH /api/rides/:ride_id/cancel-driver` - Cancel a ride (driver)

### Billing

- `GET /api/billing/customer/:customer_id` - Get customer bills
- `GET /api/billing/driver/:driver_id` - Get driver bills
- `POST /api/billing/:bill_id/pay` - Process payment

### Pricing

- `POST /api/pricing/estimate` - Get fare estimate

### Statistics

- `GET /api/stats/revenue` - Get revenue statistics
- `GET /api/stats/rides-by-area` - Get ride statistics by area
- `GET /api/stats/graph-data` - Get various graph data

## Performance Optimization

The system implements several optimizations:

1. **Redis Caching**: Frequently accessed data is cached to reduce database load
2. **Message Batching**: Kafka messages are batched for efficient processing
3. **Geospatial Indexing**: Efficient location-based queries using MongoDB's geospatial indexes
4. **Asynchronous Processing**: Decoupled processing with Kafka for better scalability

## Security

The application implements various security measures:

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: bcrypt for secure password storage
3. **Input Validation**: Request validation to prevent malicious inputs
4. **Role-Based Access Control**: Different permissions for customers, drivers, and admins

## Machine Learning Component

The fare prediction system uses XGBoost to predict ride fares based on:

1. Distance between pickup and dropoff locations
2. Time of day
3. Day of week
4. Historical demand patterns

The model is trained in `ML_train.py` and served via a FastAPI endpoint in `predict_API.py`.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgements

- This project uses the OpenStreetMap geocoding service for address to coordinates conversion
- XGBoost for the machine learning model
- Express.js, MongoDB, Redis, and Kafka for the backend infrastructure

---
