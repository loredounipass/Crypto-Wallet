import React from 'react';

export default function NewChatDialog({ open, onClose, onSelectUser, currentUserId, shareUrl }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#1c1c1e', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px',
        color: 'white'
      }}>
        <h3 style={{ marginTop: 0 }}>Compartir publicación</h3>
        <p style={{ fontSize: '14px', color: '#8e8e93' }}>Búsqueda de contactos (Stub)</p>
        <button onClick={onClose} style={{
          marginTop: '10px', background: '#3a3a3c', border: 'none', color: 'white',
          padding: '8px 16px', borderRadius: '8px', cursor: 'pointer'
        }}>Cerrar</button>
      </div>
    </div>
  );
}
