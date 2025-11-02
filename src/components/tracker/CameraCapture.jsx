import React, { useState, useRef } from 'react';
import { Camera, X, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

export default function CameraCapture({ myName, myLocation, groupId, onSent, user }) {
  const [showDialog, setShowDialog] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);

  const handleCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage({ file, preview: e.target.result });
        setShowDialog(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!capturedImage) return;

    setIsSending(true);
    try {
      const file = capturedImage.file;
      const fileName = `photo-${Date.now()}.${file.name.split('.').pop()}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(`${groupId}/${fileName}`, file);

      if (uploadError) throw uploadError;

      // 2. Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(`${groupId}/${fileName}`);

      const file_url = publicUrlData.publicUrl;

      // 3. Save metadata to Supabase Database
      const { error: dbError } = await supabase.from('FestivalPhoto').insert({
        image_url: file_url,
        caption: caption,
        partner_name: myName || 'Partner',
        latitude: myLocation?.latitude,
        longitude: myLocation?.longitude,
        group_id: groupId,
        created_by_email: user.email,
        created_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      toast.success('Photo sent! 📸');
      setShowDialog(false);
      setCapturedImage(null);
      setCaption('');
      onSent?.();
    } catch (error) {
      toast.error('Failed to send photo');
      console.error(error);
    }
    setIsSending(false);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="button button-primary"
        style={{ width: '100%', height: '3.5rem', background: 'linear-gradient(to right, #f5576c, #f093fb)' }}
      >
        <Camera className="w-5 h-5 mr-2" />
        Take & Share Photo
      </button>

      {/* Basic Dialog */}
      {showDialog && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%' }}>
            <h3>Send Photo to Partner</h3>
            {capturedImage && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <img
                  src={capturedImage.preview}
                  alt="Captured"
                  style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover', borderRadius: '0.5rem' }}
                />
                <input
                  placeholder="Add a caption... 💕"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="input"
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setShowDialog(false);
                      setCapturedImage(null);
                      setCaption('');
                    }}
                    className="button button-outline"
                    style={{ flex: 1 }}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={isSending}
                    className="button button-primary"
                    style={{ flex: 1 }}
                  >
                    {isSending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}