import React from 'react';

export default function Toast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '8px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      {message}
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>&times;</button>
    </div>
  );
}
