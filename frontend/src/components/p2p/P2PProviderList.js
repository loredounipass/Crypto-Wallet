import React from 'react';
import { useThemeMode } from '../../ui/styles';

export default function P2PProviderList({ providers, onSelectProvider }) {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  if (!providers || providers.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 20px',
        color: isDark ? '#64748B' : '#94A3B8', fontSize: 15,
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
        No hay proveedores P2P disponibles
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr',
        padding: '12px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.5px', color: isDark ? '#64748B' : '#94A3B8',
        borderBottom: `1px solid ${isDark ? '#1E1E2E' : '#F1F5F9'}`,
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
            borderBottom: `1px solid ${isDark ? '#1E1E2E' : '#F8FAFC'}`,
            transition: 'background-color 0.15s',
            minWidth: 600,
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(33,134,235,0.04)' : 'rgba(33,134,235,0.02)'}
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
                color: isDark ? '#F1F5F9' : '#0F172A',
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
              backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)',
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
                backgroundColor: isDark ? '#1E1E2E' : '#F1F5F9',
                color: isDark ? '#94A3B8' : '#64748B',
                border: `1px solid ${isDark ? '#2D2D44' : '#E2E8F0'}`,
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
                  : (isDark ? '#2D2D44' : '#E2E8F0'),
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
