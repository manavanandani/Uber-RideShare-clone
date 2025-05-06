// Create a new file: backend/utils/locationUtils.js
/**
 * Converts a MongoDB Point GeoJSON format to a simple lat/lng object
 * @param {Object} mongoLocation - MongoDB location object with type and coordinates
 * @returns {Object} Simple {latitude, longitude} object
 */
const mongoLocationToLatLng = (mongoLocation) => {
    if (!mongoLocation || !mongoLocation.coordinates) {
      return null;
    }
    return {
      latitude: mongoLocation.coordinates[1],
      longitude: mongoLocation.coordinates[0]
    };
  };
  
  /**
   * Converts a simple lat/lng object to MongoDB Point GeoJSON format
   * @param {Object} latLng - Object with latitude and longitude properties
   * @returns {Object} MongoDB GeoJSON Point object
   */
  const latLngToMongoLocation = (latLng) => {
    if (!latLng || !latLng.latitude || !latLng.longitude) {
      return null;
    }
    return {
      type: 'Point',
      coordinates: [latLng.longitude, latLng.latitude]
    };
  };

  /**
 * Safely extracts lat/lng from MongoDB GeoJSON Point
 * @param {Object} location - MongoDB GeoJSON location object
 * @returns {String} comma-separated "latitude,longitude" string
 */
const mongoLocationToString = (location) => {
  if (!location || !location.coordinates || location.coordinates.length < 2) {
    return '0.0,0.0'; // Default fallback
  }
  // MongoDB stores as [longitude, latitude]
  return `${location.coordinates[1]},${location.coordinates[0]}`;
};
  
  module.exports = {
    mongoLocationToLatLng,
    latLngToMongoLocation,
    mongoLocationToString
  };