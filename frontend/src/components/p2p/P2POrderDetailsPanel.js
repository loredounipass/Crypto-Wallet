import React from 'react';
import { useHistory } from 'react-router-dom';
import P2POrderStatus from './P2POrderStatus';

export default function P2POrderDetailsPanel({
  activeMobileTab,
  currentOrder,
  isProvider,
  isSeller,
  actionLoading,
  handleAction,
  setShowDispute,
  authEmail,
  counterpartName
}) {
  const history = useHistory();
  const borderColor = '#2D2D44';

  // Shared button styles
  const primaryBtnBase = {
    width: '100%', padding: '13px', borderRadius: 12, border: 'none',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.2s ease', letterSpacing: '0.01em',
  };

  const outlineBtnBase = {
    width: '100%', padding: '12px', borderRadius: 12,
    border: `1px solid ${borderColor}`,
    backgroundColor: 'transparent',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  return (
    <div className={`p2p-order-panel p2p-order-scroll-hidden ${activeMobileTab !== 'details' ? 'hide-on-mobile' : ''}`} style={{
      minWidth: 0,
      height: '100%',
      minHeight: 0,
      display: 'flex', flexDirection: 'column', gap: 12,
      overflowY: 'auto', overflowX: 'hidden',
    }}>
      {/* Order Status Card */}
      <div style={{
        borderRadius: 16, padding: 20,
        border: `1px solid ${borderColor}`,
        backgroundColor: '#1A1A2E',
        background: 'linear-gradient(135deg, #1A1A2E 0%, rgba(139,92,246,0.03) 100%)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          margin: '0 0 14px',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(139,92,246,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <h3 style={{
            margin: 0, fontSize: 14, fontWeight: 700,
            color: '#F1F5F9', letterSpacing: '-0.01em',
          }}>
            Estado de la Orden
          </h3>
        </div>
        <P2POrderStatus status={currentOrder?.status} />
      </div>

      {/* Order Details Card */}
      <div className="p2p-order-scroll-hidden" style={{
        borderRadius: 16, padding: 20,
        border: `1px solid ${borderColor}`,
        backgroundColor: '#1A1A2E',
        flex: 1, minHeight: 0, overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          margin: '0 0 16px',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(139,92,246,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <h3 style={{
            margin: 0, fontSize: 14, fontWeight: 700,
            color: '#F1F5F9', letterSpacing: '-0.01em',
          }}>
            Detalles
          </h3>
        </div>

        {/* Detail rows */}
        {[
          { label: 'Cantidad', value: `${currentOrder?.amount} ${currentOrder?.coin}`, highlight: true },
          { label: 'Monto USD', value: `$${currentOrder?.fiatAmount}`, color: '#10B981' },
          { label: 'Método de Pago', value: currentOrder?.paymentMethod },
          { label: 'Tu rol', value: isSeller ? '🏷️ Vendedor' : '🏪 Proveedor' },
          { label: 'Orden ID', value: currentOrder?.orderId?.slice(0, 12) + '...' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0',
            borderBottom: i < 4 ? `1px solid rgba(45,45,68,0.6)` : 'none',
          }}>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>{item.label}</span>
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: item.color || (item.highlight ? '#8B5CF6' : '#E2E8F0'),
              fontFamily: item.highlight ? 'monospace, monospace' : 'inherit',
            }}>
              {item.value}
            </span>
          </div>
        ))}

        {/* Action Buttons */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Provider: Confirm Payment */}
          {isProvider && currentOrder?.status === 'funded' && (
            <button
              onClick={() => handleAction('confirm')}
              disabled={actionLoading === 'confirm'}
              style={{
                ...primaryBtnBase,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFF',
                opacity: actionLoading === 'confirm' ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
              }}
              onMouseEnter={e => { if (actionLoading !== 'confirm') e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {actionLoading === 'confirm' ? 'Confirmando...' : '✅ Confirmar Pago Recibido'}
            </button>
          )}

          {/* Seller: Release Funds */}
          {isSeller && currentOrder?.status === 'buyer_paid' && (
            <button
              onClick={() => handleAction('release')}
              disabled={actionLoading === 'release'}
              style={{
                ...primaryBtnBase,
                background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                color: '#FFF',
                opacity: actionLoading === 'release' ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
              }}
              onMouseEnter={e => { if (actionLoading !== 'release') e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {actionLoading === 'release' ? 'Liberando...' : '🔓 Liberar Fondos'}
            </button>
          )}

          {/* Dispute - both can open */}
          {['funded', 'buyer_paid'].includes(currentOrder?.status) && (
            <button
              onClick={() => setShowDispute(true)}
              style={{
                ...outlineBtnBase,
                color: '#EF4444',
                borderColor: 'rgba(239,68,68,0.2)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              ⚠️ Abrir Disputa
            </button>
          )}

          {/* Seller: Cancel */}
          {isSeller && currentOrder?.status === 'funded' && (
            <button
              onClick={() => handleAction('cancel')}
              disabled={actionLoading === 'cancel'}
              style={{
                ...outlineBtnBase,
                color: '#94A3B8',
                opacity: actionLoading === 'cancel' ? 0.7 : 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#94A3B8'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; }}
            >
              {actionLoading === 'cancel' ? 'Cancelando...' : 'Cancelar Orden'}
            </button>
          )}

          {/* Completed message */}
          {currentOrder?.status === 'completed' && (
            <div style={{
              padding: 16, borderRadius: 14, textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
              border: '1px solid rgba(16,185,129,0.15)',
            }}>
              <p style={{ margin: 0, fontSize: 24, marginBottom: 6 }}>🎉</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#10B981' }}>
                ¡Orden completada exitosamente!
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>
                Los fondos han sido transferidos
              </p>
            </div>
          )}

          {/* Disputed message */}
          {currentOrder?.status === 'disputed' && (
            <div style={{
              padding: 16, borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))',
              border: '1px solid rgba(239,68,68,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#EF4444' }}>
                  Disputa abierta
                </p>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#94A3B8', lineHeight: 1.4 }}>
                {currentOrder?.disputeReason}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>
                Por: {currentOrder?.disputeOpenedBy === authEmail ? 'Tú' : (counterpartName || currentOrder?.disputeOpenedBy)}
              </p>
            </div>
          )}

          {/* Waiting messages */}
          {isSeller && currentOrder?.status === 'funded' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 14px', borderRadius: 12,
              backgroundColor: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.12)',
            }}>
              <span style={{ fontSize: 14 }}>⏳</span>
              <p style={{ margin: 0, fontSize: 12, color: '#F59E0B', fontWeight: 500 }}>
                Esperando confirmación del proveedor...
              </p>
            </div>
          )}
          {isProvider && currentOrder?.status === 'buyer_paid' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 14px', borderRadius: 12,
              backgroundColor: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.12)',
            }}>
              <span style={{ fontSize: 14 }}>⏳</span>
              <p style={{ margin: 0, fontSize: 12, color: '#3B82F6', fontWeight: 500 }}>
                Esperando liberación de fondos...
              </p>
            </div>
          )}
          {currentOrder?.status === 'released' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 14px', borderRadius: 12,
              backgroundColor: 'rgba(139,92,246,0.06)',
              border: '1px solid rgba(139,92,246,0.12)',
            }}>
              <span style={{
                width: 14, height: 14,
                border: '2px solid #8B5CF6', borderTop: '2px solid transparent',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                display: 'inline-block', flexShrink: 0,
              }} />
              <p style={{ margin: 0, fontSize: 12, color: '#8B5CF6', fontWeight: 500 }}>
                Procesando on-chain...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Exit Button */}
      <button
        onClick={() => history.push(isProvider ? '/providerChat' : '/p2p')}
        style={{
          width: '100%', padding: '13px', borderRadius: 12,
          border: '1px solid #2D2D44',
          backgroundColor: 'transparent',
          color: '#94A3B8', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#EF4444';
          e.currentTarget.style.color = '#EF4444';
          e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#2D2D44';
          e.currentTarget.style.color = '#94A3B8';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Salir
      </button>
    </div>
  );
}
