import React, { useState, useRef } from 'react';
import { Mic, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

export default function VoiceRecorder({ myName, groupId, onSent, user }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error('Could not access microphone');
      console.error(error);
    }
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          resolve(blob);
        };
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        clearInterval(timerRef.current);
      }
    });
  };

  const handleStopAndSend = async () => {
    setIsSending(true);
    try {
      const audioBlob = await stopRecording();
      const fileName = `voice-${Date.now()}.webm`;
      const audioFile = new File([audioBlob], fileName, { type: 'audio/webm' });

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(`${groupId}/${fileName}`, audioFile);

      if (uploadError) throw uploadError;

      // 2. Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(`${groupId}/${fileName}`);

      const file_url = publicUrlData.publicUrl;

      // 3. Save metadata to Supabase Database
      const { error: dbError } = await supabase.from('VoiceMessage').insert({
        audio_url: file_url,
        duration: duration,
        partner_name: myName || 'Partner',
        is_played: false,
        group_id: groupId,
        created_by_email: user.email,
        created_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      toast.success('Voice message sent! 🎤');
      setDuration(0);
      onSent?.();
    } catch (error) {
      toast.error('Failed to send voice message');
      console.error(error);
    }
    setIsSending(false);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', 
        backgroundColor: '#fffbe6', borderRadius: '1rem', border: '2px solid #feec85'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <div style={{ width: '0.75rem', height: '0.75rem', backgroundColor: '#ef4444', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
          <span style={{ color: '#b45309', fontWeight: 600 }}>Recording...</span>
          <span style={{ color: '#b45309', fontFamily: 'monospace', fontSize: '0.875rem', marginLeft: 'auto' }}>
            {formatDuration(duration)}
          </span>
        </div>
        <button
          onClick={handleStopAndSend}
          disabled={isSending}
          className="button button-primary"
          style={{ height: '2.5rem', padding: '0 0.75rem' }}
        >
          {isSending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          Send
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startRecording}
      className="button button-primary"
      style={{ width: '100%', height: '3.5rem' }}
    >
      <Mic size={20} />
      Hold to Record Voice Message
    </button>
  );
}