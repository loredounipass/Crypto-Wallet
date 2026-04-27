import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import useEscrow from '../../hooks/useEscrow';

const ProviderChatComponent = () => {
  const history = useHistory();
  const { providerOrders, getProviderOrders, isLoading, error } = useEscrow();
  const cardBg = '#1A1A2E';
  const panelBg = '#0F0F1A';
  const borderColor = '#2D2D44';

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'released':
        return '#10B981';
      case 'funded':
      case 'buyer_paid':
        return '#F59E0B';
      case 'disputed':
        return '#EF4444';
      default:
        return '#94A3B8';
    }
  };

  useEffect(() => {
    getProviderOrders();
  }, [getProviderOrders]);

  return (
    <div style={{
      width: '100%',
      maxWidth: 1020,
      margin: '0 auto',
      borderRadius: 16,
      border: `1px solid ${borderColor}`,
      backgroundColor: cardBg,
      boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
      padding: 20,
    }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#F1F5F9' }}>Órdenes P2P (Proveedor)</h2>
        <button
          type="button"
          onClick={getProviderOrders}
          style={{
            borderRadius: 10,
            border: `1px solid ${borderColor}`,
            backgroundColor: 'transparent',
            color: '#CBD5E1',
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Recargar
        </button>
      </div>

      {isLoading && (
        <p style={{ margin: 0, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#94A3B8', backgroundColor: panelBg }}>
          Cargando órdenes...
        </p>
      )}

      {!isLoading && error && (
        <p style={{
          margin: 0,
          borderRadius: 10,
          border: '1px solid rgba(239,68,68,0.35)',
          backgroundColor: 'rgba(239,68,68,0.12)',
          padding: '12px 14px',
          fontSize: 13,
          color: '#FCA5A5',
        }}>
          {error.message || 'No se pudieron cargar las órdenes del proveedor.'}
        </p>
      )}

      {!isLoading && !error && providerOrders.length === 0 && (
        <p style={{ margin: 0, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#94A3B8', backgroundColor: panelBg }}>
          Aún no tienes órdenes P2P asignadas.
        </p>
      )}

      {!isLoading && providerOrders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {providerOrders.map((order) => (
            <div
              key={order.orderId}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                borderRadius: 14,
                border: `1px solid ${borderColor}`,
                backgroundColor: panelBg,
                padding: 16,
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>
                  Orden: {order.orderId}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#CBD5E1' }}>
                  Vendedor: {order.sellerEmail}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#CBD5E1' }}>
                  {order.amount} {order.coin} - {order.paymentMethod}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: getStatusColor(order.status), fontWeight: 600 }}>
                  Estado: {order.status}
                </p>
              </div>

              <button
                type="button"
                onClick={() => history.push(`/p2p/order/${order.orderId}`)}
                style={{
                  alignSelf: 'flex-start',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #2186EB, #1A6BC7)',
                  color: '#FFF',
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(33,134,235,0.30)',
                }}
              >
                Abrir Chat de Orden
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderChatComponent;
