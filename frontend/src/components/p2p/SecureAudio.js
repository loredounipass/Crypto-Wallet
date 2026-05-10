import React, { useState, useEffect, useRef, useMemo } from 'react';
import useMessagesAndMultimedia from '../../hooks/useMessagesAndMultimedia';

// Helper to format time (e.g., 0:05)
const formatTime = (time) => {
  if (isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// Generate pseudo-random waveform bars for visual effect
const generateWaveform = (count = 32) => {
  const bars = [];
  for (let i = 0; i < count; i++) {
    // Create a natural-looking waveform pattern
    const base = Math.sin((i / count) * Math.PI) * 0.6 + 0.3;
    const noise = Math.sin(i * 2.7) * 0.2 + Math.cos(i * 1.3) * 0.15;
    bars.push(Math.max(0.15, Math.min(1, base + noise)));
  }
  return bars;
};

export default function SecureAudio({ url, isMe }) {
  const { getSecureMedia } = useMessagesAndMultimedia();
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);
  const waveformRef = useRef(null);

  // Memoize waveform so it doesn't change on re-renders
  const waveformBars = useMemo(() => generateWaveform(36), []);

  useEffect(() => {
    let active = true;
    if (!url) return;

    getSecureMedia(url)
      .then(res => {
        if (active && res && res.data) {
          setBlobUrl(URL.createObjectURL(res.data));
        }
      })
      .catch(err => {
        console.error(`Failed to load audio from ${url}`, err);
        if (active) setError(true);
      });

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const handleWaveformClick = (e) => {
    if (!waveformRef.current || !audioRef.current || !duration) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, width: '240px', background: 'rgba(239, 68, 68, 0.1)', color: '#F87171', fontSize: 12 }}>
        ⚠️ Error al cargar el audio.
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '240px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(139,92,246,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%',
            border: `2px solid ${isMe ? '#FFF' : '#8B5CF6'}`, borderTop: '2px solid transparent',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
        <span style={{ fontSize: 12, color: isMe ? 'rgba(255,255,255,0.7)' : '#94A3B8' }}>Cargando audio...</span>
      </div>
    );
  }

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // Colors based on sender
  const playBtnBg = isMe ? 'rgba(255,255,255,0.2)' : 'rgba(139,92,246,0.15)';
  const playIconColor = isMe ? '#FFFFFF' : '#8B5CF6';
  const barActiveColor = isMe ? '#FFFFFF' : '#8B5CF6';
  const barInactiveColor = isMe ? 'rgba(255,255,255,0.3)' : 'rgba(139,92,246,0.25)';
  const timeColor = isMe ? 'rgba(255,255,255,0.6)' : '#64748B';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minWidth: '220px', maxWidth: '280px' }}>
      <audio
        ref={audioRef}
        src={blobUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          backgroundColor: playBtnBg, border: 'none', cursor: 'pointer',
          transition: 'transform 0.1s ease, background 0.2s',
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill={playIconColor}>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill={playIconColor} style={{ marginLeft: 2 }}>
            <path d="M7 6v12l10-6L7 6z" />
          </svg>
        )}
      </button>

      {/* Waveform & Time */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 3 }}>
        {/* Waveform bars */}
        <div
          ref={waveformRef}
          onClick={handleWaveformClick}
          style={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            height: 28, cursor: 'pointer', paddingTop: 2,
          }}
        >
          {waveformBars.map((height, idx) => {
            const barPercent = ((idx + 1) / waveformBars.length) * 100;
            const isActive = barPercent <= progressPercent;
            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: `${height * 100}%`,
                  minHeight: 3,
                  borderRadius: 2,
                  backgroundColor: isActive ? barActiveColor : barInactiveColor,
                  transition: 'background-color 0.1s',
                }}
              />
            );
          })}
        </div>

        {/* Time Text */}
        <div style={{ fontSize: 11, fontWeight: 500, color: timeColor, fontVariantNumeric: 'tabular-nums' }}>
          {isPlaying || currentTime > 0 ? formatTime(currentTime) : formatTime(duration)}
        </div>
      </div>
    </div>
  );
}
