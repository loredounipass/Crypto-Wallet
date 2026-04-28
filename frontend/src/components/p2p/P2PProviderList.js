import React from 'react';


export default function P2PProviderList({ providers, onSelectProvider }) {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth <= 640);
  
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!providers || providers.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 20px',
        color: '#64748B', fontSize: 15,
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
        No hay proveedores P2P disponibles
      </div>
    );
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px' }}>
        {providers.map((provider) => (
          <div key={provider._id} style={{
            backgroundColor: '#0F0F1A',
            border: '1px solid #2D2D44',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #2186EB, #1A6BC7)',
                  color: '#FFF', fontSize: 18, fontWeight: 700, flexShrink: 0,
                }}>
                  {provider.firstName?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>
                    {provider.firstName} {provider.lastName}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
                    {provider.email}
                  </p>
                </div>
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 6,
                backgroundColor: 'rgba(16,185,129,0.1)',
                color: '#10B981', fontSize: 12, fontWeight: 600,
              }}>
                {provider.completedOrders || 0}
                <span style={{ fontSize: 10, fontWeight: 400 }}>órdenes</span>
              </div>
            </div>

            <div>
              <p style={{ margin: '0 0 6px 0', fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Métodos de Pago</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(provider.paymentMethods || []).map((pm, i) => (
                  <span key={i} style={{
                    padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500,
                    backgroundColor: '#1E1E2E',
                    color: '#94A3B8',
                    border: '1px solid #2D2D44',
                  }}>
                    {pm}
                  </span>
                ))}
                {(!provider.paymentMethods || provider.paymentMethods.length === 0) && (
                  <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>Sin métodos</span>
                )}
              </div>
            </div>

            <button
              onClick={() => onSelectProvider(provider)}
              disabled={!provider.walletAddress}
              style={{
                width: '100%',
                padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                border: 'none',
                background: provider.walletAddress
                  ? 'linear-gradient(135deg, #2186EB 0%, #1A6BC7 100%)'
                  : ('#2D2D44'),
                color: provider.walletAddress ? '#FFF' : '#94A3B8',
                cursor: provider.walletAddress ? 'pointer' : 'not-allowed',
                boxShadow: provider.walletAddress ? '0 4px 12px rgba(33,134,235,0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Vender a este proveedor
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr',
        padding: '12px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.5px', color: '#64748B',
        borderBottom: `1px solid ${'#1E1E2E'}`,
        minWidth: 600,
      }}>
        <span>Proveedor</span>
        <span>Órdenes</span>
        <span>Métodos de Pago</span>
        <span style={{ textAlign: 'right' }}>Acción</span>
      </div>

      {/* Rows */}
      {providers.map((provider) => (
        <div
          key={provider._id}
          style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr',
            padding: '16px 20px', alignItems: 'center',
            borderBottom: `1px solid ${'#1E1E2E'}`,
            transition: 'background-color 0.15s',
            minWidth: 600,
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(33,134,235,0.04)'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {/* Provider Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #2186EB, #1A6BC7)',
              color: '#FFF', fontSize: 16, fontWeight: 700, flexShrink: 0,
            }}>
              {provider.firstName?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p style={{
                margin: 0, fontSize: 14, fontWeight: 600,
                color: '#F1F5F9',
              }}>
                {provider.firstName} {provider.lastName}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
                {provider.email}
              </p>
            </div>
          </div>

          {/* Orders */}
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 6,
              backgroundColor: 'rgba(16,185,129,0.1)',
              color: '#10B981', fontSize: 13, fontWeight: 600,
            }}>
              {provider.completedOrders || 0}
              <span style={{ fontSize: 11, fontWeight: 400 }}>completadas</span>
            </span>
          </div>

          {/* Payment Methods */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(provider.paymentMethods || []).slice(0, 3).map((pm, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500,
                backgroundColor: '#1E1E2E',
                color: '#94A3B8',
                border: `1px solid ${'#2D2D44'}`,
              }}>
                {pm}
              </span>
            ))}
            {(provider.paymentMethods || []).length > 3 && (
              <span style={{ fontSize: 11, color: '#94A3B8', alignSelf: 'center' }}>
                +{provider.paymentMethods.length - 3}
              </span>
            )}
            {(!provider.paymentMethods || provider.paymentMethods.length === 0) && (
              <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>Sin métodos</span>
            )}
          </div>

          {/* Action */}
          <div style={{ textAlign: 'right' }}>
            <button
              onClick={() => onSelectProvider(provider)}
              disabled={!provider.walletAddress}
              style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: 'none',
                background: provider.walletAddress
                  ? 'linear-gradient(135deg, #2186EB 0%, #1A6BC7 100%)'
                  : ('#2D2D44'),
                color: provider.walletAddress ? '#FFF' : '#94A3B8',
                cursor: provider.walletAddress ? 'pointer' : 'not-allowed',
                boxShadow: provider.walletAddress ? '0 2px 8px rgba(33,134,235,0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Vender
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
