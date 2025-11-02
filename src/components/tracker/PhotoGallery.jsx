import React from 'react';
import { format } from 'date-fns';
import { MapPin, ImageIcon } from 'lucide-react';

export default function PhotoGallery({ photos, currentUserEmail }) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>No photos shared yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {photos.map((photo) => {
        const isFromMe = photo.created_by_email === currentUserEmail; // Fixed: 'created_by_email'

        return (
          <div
            key={photo.id}
            className="group relative aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
          >
            <img
              src={photo.image_url}
              alt={photo.caption || 'Festival photo'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <p className="text-xs font-semibold mb-1">
                  {isFromMe ? '📸 You' : `💕 ${photo.partner_name}`}
                </p>
                {photo.caption && (
                  <p className="text-xs mb-1">{photo.caption}</p>
                )}
                <p className="text-xs opacity-75">
                  {format(new Date(photo.created_at), 'h:mm a')} {/* Fixed: 'created_at' */}
                </p>
                {photo.latitude && photo.longitude && (
                  <p className="text-xs opacity-75 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    Location saved
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}