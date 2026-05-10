import React from 'react';
import { useHistory } from 'react-router-dom';

export default function P2PChatHeader({
  borderColor,
  counterpartName,
  isProvider,
  isSeller
}) {
  const history = useHistory();
  const initial = counterpartName?.charAt(0)?.toUpperCase() || '?';

  const handleBack = () => {
    if (isProvider) {
      history.push('/providerChat');
    } else {
      history.push('/p2p');
    }
  };

  return (
    <div style={{
      padding: '10px 16px',
      borderBottom: `1px solid ${borderColor}`,
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'linear-gradient(180deg, rgba(139,92,246,0.04) 0%, transparent 100%)',
    }}>
      {/* Back button */}
      <button
        onClick={handleBack}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'transparent', border: '1px solid transparent',
          color: '#94A3B8', cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.08)';
          e.currentTarget.style.borderColor = 'rgba(139,92,246,0.15)';
          e.currentTarget.style.color = '#8B5CF6';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.color = '#94A3B8';
        }}
        title="Regresar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      {/* Avatar */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FFF', fontSize: 16, fontWeight: 700,
          boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
        }}>
          {initial}
        </div>
        {/* Online indicator */}
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 12, height: 12, borderRadius: '50%',
          backgroundColor: '#10B981',
          border: '2px solid #1A1A2E',
        }} />
      </div>
      {/* Info */}
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.01em' }}>
          {counterpartName}
        </p>
        <p style={{ margin: '1px 0 0', fontSize: 12, color: '#10B981', fontWeight: 500 }}>
          En línea
        </p>
      </div>
      {/* Escrow shield icon */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(139,92,246,0.08)',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
    </div>
  );
}
