import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png"
});

const LocationMarker = ({ setPickup }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPickup({ lat, lng });
    },
  });

  return null;
};

const CustomerMap = ({ pickup, setPickup }) => {
  return (
    <MapContainer center={[37.7749, -122.4194]} zoom={13} className="h-80 w-full rounded shadow-md">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
      />
      {pickup && <Marker position={[pickup.lat, pickup.lng]} />}
      <LocationMarker setPickup={setPickup} />
    </MapContainer>
  );
};

export default CustomerMap;
