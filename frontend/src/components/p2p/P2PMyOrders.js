import React from 'react';
import useP2PMyOrdersLogic from './useP2PMyOrdersLogic';

export default function P2PMyOrders({ orders, userRole = 'seller' }) {
  const {
    t,
    isMobile,
    navigate,
    STATUS_COLORS,
    STATUS_LABELS,
    formatName
  } = useP2PMyOrdersLogic();

  if (!orders || orders.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 20px',
        color: '#9CA3AF', fontSize: 15,
      }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(168,85,247,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
        </div>
        {t('p2p_no_orders')}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px' }}>
        {orders.map((order) => {
          const statusColor = STATUS_COLORS[order.status] || '#9CA3AF';
          const statusLabel = STATUS_LABELS[order.status] || order.status;
          const counterparty = order.counterpartName ? formatName(order.counterpartName) : (userRole === 'seller' ? order.providerEmail : order.sellerEmail);
          const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('es', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          }) : '';

          return (
            <div key={order.orderId} style={{
              backgroundColor: '#1A1A28',
              border: '1px solid #23233A',
              borderRadius: 16,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#E5E7EB' }}>
                    {order.orderId?.slice(0, 8)}...
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{date}</p>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  backgroundColor: `${statusColor}15`,
                  color: statusColor,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusColor }} />
                  {statusLabel}
                </div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#0A0A14', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>{t('p2p_crypto')}</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                    {order.amount} <span style={{ fontSize: 12, color: '#9CA3AF' }}>{order.coin}</span>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>{t('p2p_fiat')}</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#A855F7' }}>
                    ${order.fiatAmount} <span style={{ fontSize: 12, color: '#9CA3AF' }}>USD</span>
                  </p>
                </div>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>{t(userRole === 'seller' ? 'p2p_provider' : 'p2p_seller')}</p>
                <p style={{ margin: 0, fontSize: 13, color: '#E5E7EB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {counterparty}
                </p>
              </div>

              <button
                onClick={() => navigate(`/p2p/order/${order.orderId}`)}
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  border: '1px solid #23233A',
                  backgroundColor: 'transparent',
                  color: '#FFF',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#A855F7'; e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.05)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#23233A'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {t('p2p_view_order')}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 0.8fr',
        padding: '12px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.5px', color: '#9CA3AF',
        borderBottom: `1px solid ${'#1C1C2A'}`,
        minWidth: 700,
      }}>
        <span>{t('p2p_order_header')}</span>
        <span>{t(userRole === 'seller' ? 'p2p_provider' : 'p2p_seller')}</span>
        <span>{t('p2p_amount')}</span>
        <span>{t('p2p_fiat')}</span>
        <span>{t('p2p_status')}</span>
        <span style={{ textAlign: 'right' }}>{t('p2p_action')}</span>
      </div>

      {/* Rows */}
      {orders.map((order) => {
        const statusColor = STATUS_COLORS[order.status] || '#9CA3AF';
        const statusLabel = STATUS_LABELS[order.status] || order.status;
        const counterparty = order.counterpartName ? formatName(order.counterpartName) : (userRole === 'seller' ? order.providerEmail : order.sellerEmail);
        const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('es', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        }) : '';

        return (
          <div
            key={order.orderId}
            style={{
              display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 0.8fr',
              padding: '14px 20px', alignItems: 'center',
              borderBottom: `1px solid ${'#1C1C2A'}`,
              transition: 'background-color 0.15s',
              minWidth: 700,
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.04)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {/* Order ID + date */}
            <div>
              <p style={{
                margin: 0, fontSize: 13, fontWeight: 600, fontFamily: 'monospace',
                color: '#E5E7EB',
              }}>
                {order.orderId?.slice(0, 8)}...
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{date}</p>
            </div>

            {/* Counterparty */}
            <div>
              <p style={{
                margin: 0, fontSize: 13, color: '#9CA3AF',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {counterparty}
              </p>
            </div>

            {/* Amount */}
            <div>
              <span style={{
                fontSize: 14, fontWeight: 700, color: '#FFFFFF',
              }}>
                {order.amount} {order.coin}
              </span>
            </div>

            {/* Fiat */}
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#A855F7' }}>
                ${order.fiatAmount}
              </span>
              <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>USD</span>
            </div>

            {/* Status */}
            <div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                backgroundColor: `${statusColor}15`,
                color: statusColor,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: statusColor,
                }} />
                {statusLabel}
              </span>
            </div>

            {/* Action */}
            <div style={{ textAlign: 'right' }}>
<button
              onClick={() => navigate(`/p2p/order/${order.orderId}`)}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                border: `1px solid ${'#23233A'}`,
                backgroundColor: 'transparent',
                color: '#9CA3AF',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#A855F7'; e.currentTarget.style.color = '#A855F7'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#23233A'; e.currentTarget.style.color = '#9CA3AF'; }}
            >
              {t('p2p_view')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
