import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import useEscrow from '../../hooks/useEscrow';

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente', color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', icon: '⏳' },
  funded:     { label: 'En Escrow', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', icon: '🔒' },
  buyer_paid: { label: 'Pago Confirmado', color: '#3B82F6', bg: 'rgba(59,130,246,0.10)', icon: '✅' },
  released:   { label: 'Liberando', color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', icon: '🚀' },
  completed:  { label: 'Completado', color: '#10B981', bg: 'rgba(16,185,129,0.10)', icon: '🎉' },
  disputed:   { label: 'Disputa', color: '#EF4444', bg: 'rgba(239,68,68,0.10)', icon: '⚠️' },
  refunded:   { label: 'Reembolsado', color: '#6B7280', bg: 'rgba(107,114,128,0.10)', icon: '↩️' },
  cancelled:  { label: 'Cancelado', color: '#6B7280', bg: 'rgba(107,114,128,0.10)', icon: '❌' },
  expired:    { label: 'Expirado', color: '#6B7280', bg: 'rgba(107,114,128,0.10)', icon: '⏰' },
};

const FILTER_TABS = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Activas' },
  { key: 'completed', label: 'Completadas' },
  { key: 'other', label: 'Otras' },
];

const formatName = (nameStr) => {
  if (!nameStr || nameStr.includes('@')) return nameStr;
  return nameStr.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const ProviderChatComponent = () => {
  const history = useHistory();
  const { providerOrders, getProviderOrders, isLoading, error } = useEscrow();
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    getProviderOrders();
  }, [getProviderOrders]);

  const filteredOrders = providerOrders.filter(order => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return ['funded', 'buyer_paid', 'released', 'pending'].includes(order.status);
    if (activeFilter === 'completed') return order.status === 'completed';
    return ['cancelled', 'expired', 'refunded', 'disputed'].includes(order.status);
  });

  const activeCount = providerOrders.filter(o => ['funded', 'buyer_paid', 'released', 'pending'].includes(o.status)).length;

  return (
    <div style={{
      width: '100%',
      maxWidth: 1020,
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em' }}>
              Órdenes P2P
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>
              {providerOrders.length} {providerOrders.length === 1 ? 'orden' : 'órdenes'} como proveedor
              {activeCount > 0 && <span style={{ color: '#F59E0B', fontWeight: 600 }}> · {activeCount} activa{activeCount > 1 ? 's' : ''}</span>}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={getProviderOrders}
          disabled={isLoading}
          style={{
            borderRadius: 10,
            border: '1px solid #2D2D44',
            backgroundColor: 'transparent',
            color: '#94A3B8',
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s',
            opacity: isLoading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#8B5CF6'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2D2D44'; e.currentTarget.style.color = '#94A3B8'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }}>
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          {isLoading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 16,
        padding: 4, borderRadius: 12,
        backgroundColor: 'rgba(15,15,26,0.6)',
        border: '1px solid #2D2D44',
      }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 8,
              border: 'none', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              backgroundColor: activeFilter === tab.key ? 'rgba(139,92,246,0.15)' : 'transparent',
              color: activeFilter === tab.key ? '#A78BFA' : '#64748B',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '40px 20px',
          borderRadius: 16, backgroundColor: '#1A1A2E',
          border: '1px solid #2D2D44',
        }}>
          <span style={{
            width: 20, height: 20,
            border: '2px solid #8B5CF6', borderTop: '2px solid transparent',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: 14, color: '#94A3B8' }}>Cargando órdenes...</span>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px 20px', borderRadius: 14,
          border: '1px solid rgba(239,68,68,0.2)',
          backgroundColor: 'rgba(239,68,68,0.06)',
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <p style={{ margin: 0, fontSize: 13, color: '#FCA5A5' }}>
            {error.message || 'No se pudieron cargar las órdenes del proveedor.'}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && providerOrders.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          borderRadius: 16, backgroundColor: '#1A1A2E',
          border: '1px solid #2D2D44',
        }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 16px', borderRadius: '50%',
            background: 'rgba(139,92,246,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#94A3B8' }}>Aún no tienes órdenes P2P</p>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748B' }}>Las órdenes asignadas aparecerán aquí</p>
        </div>
      )}

      {/* Filtered empty */}
      {!isLoading && providerOrders.length > 0 && filteredOrders.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          borderRadius: 16, backgroundColor: '#1A1A2E',
          border: '1px solid #2D2D44',
        }}>
          <p style={{ margin: 0, fontSize: 14, color: '#64748B' }}>No hay órdenes en esta categoría</p>
        </div>
      )}

      {/* Order Cards */}
      {!isLoading && filteredOrders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredOrders.map((order) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const counterparty = order.counterpartName ? formatName(order.counterpartName) : order.sellerEmail;
            const initial = counterparty?.charAt(0)?.toUpperCase() || '?';
            const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('es', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            }) : '';
            const isActive = ['funded', 'buyer_paid', 'released'].includes(order.status);

            return (
              <div
                key={order.orderId}
                onClick={() => history.push(`/p2p/order/${order.orderId}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  borderRadius: 14,
                  border: `1px solid ${isActive ? 'rgba(139,92,246,0.15)' : '#2D2D44'}`,
                  backgroundColor: '#1A1A2E',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#1A1A2E';
                  e.currentTarget.style.borderColor = isActive ? 'rgba(139,92,246,0.15)' : '#2D2D44';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Active indicator line */}
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                    background: 'linear-gradient(180deg, #7C3AED, #6366F1)',
                    borderRadius: '0 2px 2px 0',
                  }} />
                )}

                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FFF', fontSize: 16, fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(124,58,237,0.2)',
                }}>
                  {initial}
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {counterparty}
                    </span>
                    {/* Status badge */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 10,
                      backgroundColor: config.bg, color: config.color,
                      fontSize: 11, fontWeight: 600, flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 10 }}>{config.icon}</span>
                      {config.label}
                    </span>
                  </div>

                  {/* Secondary info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600, color: '#8B5CF6',
                      fontFamily: 'monospace, monospace',
                    }}>
                      {order.amount} {order.coin}
                    </span>
                    <span style={{ color: '#2D2D44', fontSize: 10 }}>•</span>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>
                      ${order.fiatAmount} USD
                    </span>
                    <span style={{ color: '#2D2D44', fontSize: 10 }}>•</span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>
                      {order.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Right side - date & arrow */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>
                    {date}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProviderChatComponent;
