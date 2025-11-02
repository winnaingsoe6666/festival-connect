import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import { Navigation, Heart } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom partner marker icons
const createCustomIcon = (color, emoji) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: 20px;">${emoji}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};


export default function MapView({
  myLocation,
  partnerLocation,
  myName,
  partnerName,
  showHistory = false,
  myHistory = [],
  partnerHistory = [],
}) {
  const mapRef = useRef(null);

  const myIcon = createCustomIcon('linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '📍');
  const partnerIcon = createCustomIcon('linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', '💕');

  const center = myLocation
    ? [myLocation.latitude, myLocation.longitude]
    : [18.7883, 98.9853]; // Default to Chiang Mai

  useEffect(() => {
    if (mapRef.current && (myLocation || partnerLocation)) {
      const bounds = L.latLngBounds();
      if(myLocation) bounds.extend([myLocation.latitude, myLocation.longitude]);
      if(partnerLocation) bounds.extend([partnerLocation.latitude, partnerLocation.longitude]);

      // Include history points in bounds if showing history
      if (showHistory) {
        myHistory.forEach((loc) => {
          bounds.extend([loc.latitude, loc.longitude]);
        });
        partnerHistory.forEach((loc) => {
          bounds.extend([loc.latitude, loc.longitude]);
        });
      }

      if (bounds.isValid()) {
         mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [myLocation, partnerLocation, showHistory, myHistory, partnerHistory]);

  // Convert history to polyline coordinates
  const myPath = myHistory
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // Fixed: 'created_at'
    .map((loc) => [loc.latitude, loc.longitude]);

  const partnerPath = partnerHistory
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // Fixed: 'created_at'
    .map((loc) => [loc.latitude, loc.longitude]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* My History Path */}
        {showHistory && myPath.length > 1 && (
          <>
            <Polyline
              positions={myPath}
              pathOptions={{
                color: '#667eea',
                weight: 4,
                opacity: 0.7,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* History points */}
            {myHistory.map((loc, idx) => (
              <Circle
                key={`my-history-${idx}`}
                center={[loc.latitude, loc.longitude]}
                radius={3}
                pathOptions={{
                  fillColor: '#667eea',
                  color: 'white',
                  weight: 1,
                  opacity: 1,
                  fillOpacity: 0.6,
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-semibold text-purple-700">Your location</p>
                    <p className="text-gray-600">
                      {new Date(loc.created_at).toLocaleString()} {/* Fixed: 'created_at' */}
                    </p>
                  </div>
                </Popup>
              </Circle>
            ))}
          </>
        )}

        {/* Partner History Path */}
        {showHistory && partnerPath.length > 1 && (
          <>
            <Polyline
              positions={partnerPath}
              pathOptions={{
                color: '#f5576c',
                weight: 4,
                opacity: 0.7,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* History points */}
            {partnerHistory.map((loc, idx) => (
              <Circle
                key={`partner-history-${idx}`}
                center={[loc.latitude, loc.longitude]}
                radius={3}
                pathOptions={{
                  fillColor: '#f5576c',
                  color: 'white',
                  weight: 1,
                  opacity: 1,
                  fillOpacity: 0.6,
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-semibold text-pink-600">{partnerName}'s location</p>
                    <p className="text-gray-600">
                      {new Date(loc.created_at).toLocaleString()} {/* Fixed: 'created_at' */}
                    </p>
                  </div>
                </Popup>
              </Circle>
            ))}
          </>
        )}

        {/* Current Location - Me */}
        {myLocation && (
          <>
            <Marker
              position={[myLocation.latitude, myLocation.longitude]}
              icon={myIcon}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-purple-700">📍 You (Now)</p>
                  <p className="text-xs text-gray-600">{myName || 'You'}</p>
                  <p className="text-xs text-gray-500">
                    ±{myLocation.accuracy?.toFixed(0)}m accuracy
                  </p>
                </div>
              </Popup>
            </Marker>
            {myLocation.accuracy && (
              <Circle
                center={[myLocation.latitude, myLocation.longitude]}
                radius={myLocation.accuracy}
                pathOptions={{ color: '#667eea', fillColor: '#667eea', fillOpacity: 0.1 }}
              />
            )}
          </>
        )}

        {/* Current Location - Partner */}
        {partnerLocation && (
          <>
            <Marker
              position={[partnerLocation.latitude, partnerLocation.longitude]}
              icon={partnerIcon}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-pink-600">💕 {partnerName || 'Partner'} (Now)</p>
                  <p className="text-xs text-gray-500">
                    ±{partnerLocation.accuracy?.toFixed(0)}m accuracy
                  </p>
                </div>
              </Popup>
            </Marker>
            {partnerLocation.accuracy && (
              <Circle
                center={[partnerLocation.latitude, partnerLocation.longitude]}
                radius={partnerLocation.accuracy}
                pathOptions={{ color: '#f5576c', fillColor: '#f5576c', fillOpacity: 0.1 }}
              />
            )}
          </>
        )}

        {/* Distance line between current positions */}
        {myLocation && partnerLocation && (
          <Polyline
            positions={[
              [myLocation.latitude, myLocation.longitude],
              [partnerLocation.latitude, partnerLocation.longitude],
            ]}
            pathOptions={{
              color: '#667eea',
              weight: 3,
              opacity: 0.6,
              dashArray: '10, 10',
            }}
          />
        )}
      </MapContainer>

      {/* Map Legend */}
      {showHistory && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs z-[1000]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-1 bg-purple-500 rounded" />
            <span>Your path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-pink-500 rounded" />
            <span>Partner's path</span>
          </div>
        </div>
      )}
    </div>
  );
}