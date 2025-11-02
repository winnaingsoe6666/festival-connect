import React, { useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';

export default function VoiceMessageList({ messages, currentUserEmail }) {
  const [playingId, setPlayingId] = useState(null);
  const [audioElements] = useState({});

  const togglePlay = async (message) => {
    const audioId = message.id;

    if (playingId === audioId) {
      audioElements[audioId]?.pause();
      setPlayingId(null);
    } else {
      if (playingId && audioElements[playingId]) {
        audioElements[playingId].pause();
      }

      if (!audioElements[audioId]) {
        const audio = new Audio(message.audio_url);
        audioElements[audioId] = audio;
        audio.onended = () => setPlayingId(null);
      }

      audioElements[audioId].play();
      setPlayingId(audioId);

      if (!message.is_played && message.created_by_email !== currentUserEmail) {
        await supabase
          .from('VoiceMessage')
          .update({ is_played: true })
          .eq('id', message.id);
      }
    }
  };

  if (messages.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
        <Volume2 size={48} style={{ margin: '0 auto 0.5rem auto', opacity: 0.3 }} />
        <p>No voice messages yet</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {messages.map((message) => {
        const isFromMe = message.created_by_email === currentUserEmail;
        const isPlaying = playingId === message.id;
        
        const messageStyle = {
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem',
          borderRadius: '0.75rem',
          border: '1px solid var(--c-border)',
          backgroundColor: isFromMe ? '#f3e8ff' : '#fdf4f5',
          marginLeft: isFromMe ? '2rem' : '0',
          marginRight: isFromMe ? '0' : '2rem',
        };

        return (
          <div key={message.id} style={messageStyle}>
            <button
              onClick={() => togglePlay(message)}
              className="button button-ghost"
              style={{ 
                color: isFromMe ? 'var(--c-purple)' : '#e11d48',
                borderRadius: '50%', height: '2.5rem', width: '2.5rem', padding: 0 
              }}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 500, fontSize: '0.875rem', color: isFromMe ? 'var(--c-purple)' : '#e11d48' }}>
                {isFromMe ? 'You' : message.partner_name}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#555' }}>
                {message.duration ? `${message.duration}s` : '...'} •{' '}
                {format(new Date(message.created_at), 'h:mm a')}
              </p>
            </div>
            {!message.is_played && !isFromMe && (
              <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#e11d48', borderRadius: '50%' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}