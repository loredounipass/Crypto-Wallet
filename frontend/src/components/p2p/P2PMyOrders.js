import React from 'react';
import { useThemeMode } from '../../ui/styles';
import { useHistory } from 'react-router-dom';

const STATUS_COLORS = {
  funded: '#F59E0B', buyer_paid: '#3B82F6', released: '#8B5CF6',
  completed: '#10B981', disputed: '#EF4444', refunded: '#6B7280',
  cancelled: '#6B7280', expired: '#6B7280', pending: '#94A3B8',
};

const STATUS_LABELS = {
  pending: 'Pendiente', funded: 'En Escrow', buyer_paid: 'Pago Confirmado',
  released: 'Liberando', completed: 'Completado', disputed: 'En Disputa',
  refunded: 'Reembolsado', cancelled: 'Cancelado', expired: 'Expirado',
};

export default function P2PMyOrders({ orders, role = 'seller' }) {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const history = useHistory();

  if (!orders || orders.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 20px',
        color: isDark ? '#64748B' : '#94A3B8', fontSize: 15,
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        No tienes órdenes P2P aún
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 0.8fr',
        padding: '12px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.5px', color: isDark ? '#64748B' : '#94A3B8',
        borderBottom: `1px solid ${isDark ? '#1E1E2E' : '#F1F5F9'}`,
        minWidth: 700,
      }}>
        <span>Orden</span>
        <span>{role === 'seller' ? 'Proveedor' : 'Vendedor'}</span>
        <span>Cantidad</span>
        <span>Fiat</span>
        <span>Estado</span>
        <span style={{ textAlign: 'right' }}>Acción</span>
      </div>

      {/* Rows */}
      {orders.map((order) => {
        const statusColor = STATUS_COLORS[order.status] || '#94A3B8';
        const statusLabel = STATUS_LABELS[order.status] || order.status;
        const counterparty = role === 'seller' ? order.providerEmail : order.sellerEmail;
        const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('es', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        }) : '';

        return (
          <div
            key={order.orderId}
            style={{
              display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 0.8fr',
              padding: '14px 20px', alignItems: 'center',
              borderBottom: `1px solid ${isDark ? '#1E1E2E' : '#F8FAFC'}`,
              transition: 'background-color 0.15s',
              minWidth: 700,
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(33,134,235,0.04)' : 'rgba(33,134,235,0.02)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {/* Order ID + date */}
            <div>
              <p style={{
                margin: 0, fontSize: 13, fontWeight: 600, fontFamily: 'monospace',
                color: isDark ? '#E2E8F0' : '#1E293B',
              }}>
                {order.orderId?.slice(0, 8)}...
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>{date}</p>
            </div>

            {/* Counterparty */}
            <div>
              <p style={{
                margin: 0, fontSize: 13, color: isDark ? '#94A3B8' : '#64748B',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {counterparty}
              </p>
            </div>

            {/* Amount */}
            <div>
              <span style={{
                fontSize: 14, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A',
              }}>
                {order.amount} {order.coin}
              </span>
            </div>

            {/* Fiat */}
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2186EB' }}>
                ${order.fiatAmount}
              </span>
              <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>USD</span>
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
                onClick={() => history.push(`/p2p/order/${order.orderId}`)}
                style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${isDark ? '#2D2D44' : '#E2E8F0'}`,
                  backgroundColor: 'transparent',
                  color: isDark ? '#94A3B8' : '#64748B',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#2186EB'; e.currentTarget.style.color = '#2186EB'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = isDark ? '#2D2D44' : '#E2E8F0'; e.currentTarget.style.color = isDark ? '#94A3B8' : '#64748B'; }}
              >
                Ver
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
