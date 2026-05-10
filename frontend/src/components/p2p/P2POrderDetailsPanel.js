import React from 'react';
import P2POrderStatus from './P2POrderStatus';

export default function P2POrderDetailsPanel({
  activeMobileTab,
  currentOrder,
  isProvider,
  isSeller,
  actionLoading,
  handleAction,
  setShowDispute
}) {
  const cardBg = '#1A1A2E';
  const borderColor = '#2D2D44';

  return (
    <div className={`p2p-order-panel p2p-order-scroll-hidden ${activeMobileTab !== 'details' ? 'hide-on-mobile' : ''}`} style={{
      minWidth: 0,
      height: '100%',
      minHeight: 0,
      display: 'flex', flexDirection: 'column', gap: 16,
      overflowY: 'auto', overflowX: 'hidden',
    }}>
      {/* Order Status Card */}
      <div style={{
        borderRadius: 16, padding: 24,
        border: `1px solid ${borderColor}`, backgroundColor: cardBg,
      }}>
        <h3 style={{
          margin: '0 0 16px', fontSize: 16, fontWeight: 700,
          color: '#F1F5F9',
        }}>
          Estado de la Orden
        </h3>
        <P2POrderStatus status={currentOrder?.status} />
      </div>

      {/* Order Details Card */}
      <div className="p2p-order-scroll-hidden" style={{
        borderRadius: 16, padding: 24,
        border: `1px solid ${borderColor}`, backgroundColor: cardBg,
        flex: 1, minHeight: 0, overflowY: 'auto',
      }}>
        <h3 style={{
          margin: '0 0 16px', fontSize: 16, fontWeight: 700,
          color: '#F1F5F9',
        }}>
          Detalles
        </h3>

        {[
          { label: 'Cantidad', value: `${currentOrder?.amount} ${currentOrder?.coin}` },
          { label: 'Monto USD', value: `$${currentOrder?.fiatAmount}` },
          { label: 'Método de Pago', value: currentOrder?.paymentMethod },
          { label: 'Tu rol', value: isSeller ? '🏷️ Vendedor' : '🏪 Proveedor' },
          { label: 'Orden ID', value: currentOrder?.orderId?.slice(0, 12) + '...' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0',
            borderBottom: i < 4 ? `1px solid ${'#1E1E2E'}` : 'none',
          }}>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>{item.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>
              {item.value}
            </span>
          </div>
        ))}

        {/* Action Buttons */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Provider: Confirm Payment */}
          {isProvider && currentOrder?.status === 'funded' && (
            <button
              onClick={() => handleAction('confirm')}
              disabled={actionLoading === 'confirm'}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                opacity: actionLoading === 'confirm' ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              }}
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
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                opacity: actionLoading === 'release' ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(139,92,246,0.3)',
              }}
            >
              {actionLoading === 'release' ? 'Liberando...' : '🔓 Liberar Fondos'}
            </button>
          )}

          {/* Dispute - both can open */}
          {['funded', 'buyer_paid'].includes(currentOrder?.status) && (
            <button
              onClick={() => setShowDispute(true)}
              style={{
                width: '100%', padding: '12px', borderRadius: 10,
                border: `1px solid ${'#2D2D44'}`,
                backgroundColor: 'transparent',
                color: '#EF4444', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
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
                width: '100%', padding: '12px', borderRadius: 10,
                border: `1px solid ${'#2D2D44'}`,
                backgroundColor: 'transparent',
                color: '#94A3B8',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                opacity: actionLoading === 'cancel' ? 0.7 : 1,
              }}
            >
              {actionLoading === 'cancel' ? 'Cancelando...' : 'Cancelar Orden'}
            </button>
          )}

          {/* Completed message */}
          {currentOrder?.status === 'completed' && (
            <div style={{
              padding: 16, borderRadius: 12, textAlign: 'center',
              backgroundColor: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}>
              <p style={{ margin: 0, fontSize: 20, marginBottom: 4 }}>🎉</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#10B981' }}>
                ¡Orden completada exitosamente!
              </p>
            </div>
          )}

          {/* Disputed message */}
          {currentOrder?.status === 'disputed' && (
            <div style={{
              padding: 16, borderRadius: 12,
              backgroundColor: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#EF4444' }}>
                Disputa abierta
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>
                {currentOrder?.disputeReason}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94A3B8' }}>
                Por: {currentOrder?.disputeOpenedBy}
              </p>
            </div>
          )}

          {/* Waiting messages */}
          {isSeller && currentOrder?.status === 'funded' && (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#F59E0B', margin: 0 }}>
              ⏳ Esperando que el proveedor confirme el pago externo...
            </p>
          )}
          {isProvider && currentOrder?.status === 'buyer_paid' && (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#3B82F6', margin: 0 }}>
              ⏳ Esperando que el vendedor libere los fondos...
            </p>
          )}
          {currentOrder?.status === 'released' && (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#8B5CF6', margin: 0 }}>
              ⏳ Procesando liberación de fondos on-chain...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
