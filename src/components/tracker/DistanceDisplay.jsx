import React from 'react';
import { Navigation2, Activity } from 'lucide-react';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export default function DistanceDisplay({ myLocation, partnerLocation, partnerName }) {
  if (!myLocation || !partnerLocation) {
    return (
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 text-center shadow-lg">
        <Activity className="w-8 h-8 mx-auto mb-2 text-purple-600 animate-pulse" />
        <p className="text-gray-600">Waiting for location data...</p>
      </div>
    );
  }

  const distance = calculateDistance(
    myLocation.latitude,
    myLocation.longitude,
    partnerLocation.latitude,
    partnerLocation.longitude
  );

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(2)}km`;
    }
  };

  const getProximityMessage = (meters) => {
    if (meters < 10) return "You're right next to each other! 💕";
    if (meters < 50) return "Very close by! 🎵";
    if (meters < 100) return "Just around the corner!";
    if (meters < 500) return "Walking distance";
    if (meters < 1000) return "Not too far!";
    return "Keep tracking!";
  };

  return (
    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Navigation2 className="w-6 h-6" />
          <span className="font-semibold">Distance to {partnerName || 'Partner'}</span>
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-5xl font-bold mb-2">{formatDistance(distance)}</div>
        <div className="text-purple-100 text-sm">{getProximityMessage(distance)}</div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-purple-100 text-xs">Your Accuracy</p>
          <p className="font-semibold">±{myLocation.accuracy?.toFixed(0) || '?'}m</p>
        </div>
        <div>
          <p className="text-purple-100 text-xs">Partner Accuracy</p>
          <p className="font-semibold">±{partnerLocation.accuracy?.toFixed(0) || '?'}m</p>
        </div>
      </div>
    </div>
  );
}