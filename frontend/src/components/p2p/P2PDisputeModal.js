import React from 'react';
import useP2PDisputeModalLogic from './useP2PDisputeModalLogic';

export default function P2PDisputeModal({ open, onClose, onSubmit, isLoading }) {
  const {
    t,
    reason,
    setReason,
    handleSubmit
  } = useP2PDisputeModalLogic(onSubmit);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 460, borderRadius: 16, padding: 28,
        backgroundColor: '#12121E',
        border: `1px solid ${'#23233A'}`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(248,113,113,0.12)', fontSize: 18,
          }}>
            ⚠️
          </div>
          <div>
            <h3 style={{
              margin: 0, fontSize: 18, fontWeight: 700,
              color: '#FFFFFF',
            }}>{t('p2p_dispute_title')}</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>
              {t('p2p_dispute_description')}
            </p>
          </div>
        </div>

        {/* Reason */}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('p2p_dispute_placeholder')}
          rows={4}
          style={{
            width: '100%', padding: 12, borderRadius: 10, fontSize: 14,
            border: `1px solid ${'#23233A'}`,
            backgroundColor: '#0A0A14',
            color: '#E5E7EB',
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
              border: `1px solid ${'#23233A'}`,
              backgroundColor: 'transparent',
              color: '#9CA3AF',
              cursor: 'pointer',
            }}
          >
            {t('p2p_cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || isLoading}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              border: 'none',
              backgroundColor: reason.trim() ? '#F87171' : ('#23233A'),
              color: reason.trim() ? '#FFF' : '#9CA3AF',
              cursor: reason.trim() ? 'pointer' : 'not-allowed',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {t(isLoading ? 'p2p_sending' : 'p2p_dispute_title')}
          </button>
        </div>
      </div>
    </div>
  );
}
