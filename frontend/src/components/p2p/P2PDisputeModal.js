import React, { useState } from 'react';


export default function P2PDisputeModal({ open, onClose, onSubmit, isLoading }) {
  const [reason, setReason] = useState('');
  
  

  if (!open) return null;

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit(reason);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 460, borderRadius: 16, padding: 28,
        backgroundColor: '#1E1E2E',
        border: `1px solid ${'#2D2D44'}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(239,68,68,0.12)', fontSize: 18,
          }}>
            ⚠️
          </div>
          <div>
            <h3 style={{
              margin: 0, fontSize: 18, fontWeight: 700,
              color: '#F1F5F9',
            }}>Abrir Disputa</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
              Describe el problema con esta orden
            </p>
          </div>
        </div>

        {/* Reason */}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explica la razón de la disputa..."
          rows={4}
          style={{
            width: '100%', padding: 12, borderRadius: 10, fontSize: 14,
            border: `1px solid ${'#2D2D44'}`,
            backgroundColor: '#0F0F1A',
            color: '#E2E8F0',
            resize: 'vertical', outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              border: `1px solid ${'#2D2D44'}`,
              backgroundColor: 'transparent',
              color: '#94A3B8',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || isLoading}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              border: 'none',
              backgroundColor: reason.trim() ? '#EF4444' : ('#2D2D44'),
              color: reason.trim() ? '#FFF' : '#94A3B8',
              cursor: reason.trim() ? 'pointer' : 'not-allowed',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Enviando...' : 'Abrir Disputa'}
          </button>
        </div>
      </div>
    </div>
  );
}
