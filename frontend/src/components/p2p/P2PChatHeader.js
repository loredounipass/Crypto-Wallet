import React from 'react';

export default function P2PChatHeader({
  currentOrder,
  isProvider,
  borderColor
}) {
  const counterpartEmail = isProvider ? currentOrder?.sellerEmail : currentOrder?.providerEmail;
  const initial = counterpartEmail?.charAt(0)?.toUpperCase() || '?';

  return (
    <div style={{
      padding: '14px 20px',
      borderBottom: `1px solid ${borderColor}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#FFF', fontSize: 14, fontWeight: 700,
      }}>
        {initial}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>
          Chat P2P
        </p>
        <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
          {counterpartEmail}
        </p>
      </div>
    </div>
  );
}
