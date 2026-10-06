import React from 'react';

// MINI-PANEL DE NOTIFICACIONES (PLACEHOLDER HASTA CONECTAR EL BACKEND REAL)
export default function NotifDropdown({ open, onClose }) {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1199, background: 'transparent' }}
      />
      <div style={{
        position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1200, width: 'min(320px, 90vw)',
        background: '#12121E', border: '1px solid #2A2A3A', borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)', padding: '14px 16px',
        color: '#FFFFFF', fontSize: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong>🔔 Notificaciones</strong>
          <button
            onClick={onClose}
            aria-label="Cerrar notificaciones"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#9CA3AF', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', fontSize: 13, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
        <div style={{ color: '#9CA3AF', fontSize: 13 }}>
          No tienes notificaciones nuevas.
        </div>
      </div>
    </>
  );
}
