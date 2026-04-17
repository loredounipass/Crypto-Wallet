import React, { useState } from 'react';
import { useThemeMode } from '../../ui/styles';
import useAllWallets from '../../hooks/useAllWallets';

const PAYMENT_METHODS = [
  'Transferencia Bancaria', 'Zelle', 'PayPal', 'Nequi',
  'Mercado Pago', 'Efectivo', 'Otro'
];

export default function P2PCreateOrderModal({ open, onClose, provider, onSubmit, isLoading }) {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const { allWalletInfo: wallets } = useAllWallets();

  const [coin, setCoin] = useState('');
  const [amount, setAmount] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  if (!open || !provider) return null;

  const availablePaymentMethods = provider.paymentMethods?.length > 0
    ? provider.paymentMethods
    : PAYMENT_METHODS;

  const selectedWallet = wallets?.find(w => w.coin?.toUpperCase() === coin?.toUpperCase());
  const balance = selectedWallet?.balance || 0;

  const isValid = coin && parseFloat(amount) > 0 && parseFloat(fiatAmount) > 0
    && paymentMethod && parseFloat(amount) <= balance;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      coin: coin.toUpperCase(),
      amount: parseFloat(amount),
      fiatAmount: parseFloat(fiatAmount),
      providerEmail: provider.email,
      paymentMethod,
    });
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
    border: `1px solid ${isDark ? '#2D2D44' : '#E2E8F0'}`,
    backgroundColor: isDark ? '#0F0F1A' : '#F8FAFC',
    color: isDark ? '#E2E8F0' : '#1E293B',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6,
    color: isDark ? '#94A3B8' : '#64748B',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 500, borderRadius: 16, padding: 28,
        backgroundColor: isDark ? '#1E1E2E' : '#FFF',
        border: `1px solid ${isDark ? '#2D2D44' : '#E2E8F0'}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A' }}>
              Vender P2P
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>
              Proveedor: <span style={{ color: '#2186EB', fontWeight: 600 }}>{provider.firstName} {provider.lastName}</span>
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 22,
            color: isDark ? '#64748B' : '#94A3B8', cursor: 'pointer',
          }}>✕</button>
        </div>

        {/* Coin Select */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Criptomoneda</label>
          <select
            value={coin}
            onChange={e => setCoin(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">Seleccionar crypto...</option>
            {wallets?.map(w => (
              <option key={w.coin} value={w.coin}>
                {w.coin?.toUpperCase()} — Balance: {w.balance?.toFixed(6)}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>
            Cantidad a vender
            {selectedWallet && (
              <span style={{ float: 'right', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                Disponible: <span style={{ color: '#2186EB' }}>{balance.toFixed(6)} {coin?.toUpperCase()}</span>
              </span>
            )}
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            style={inputStyle}
          />
          {parseFloat(amount) > balance && balance > 0 && (
            <p style={{ color: '#EF4444', fontSize: 12, margin: '4px 0 0' }}>
              Balance insuficiente
            </p>
          )}
        </div>

        {/* Fiat Amount */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Monto en USD</label>
          <input
            type="number"
            step="any"
            min="0"
            value={fiatAmount}
            onChange={e => setFiatAmount(e.target.value)}
            placeholder="0.00"
            style={inputStyle}
          />
        </div>

        {/* Payment Method */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Método de pago</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {availablePaymentMethods.map(pm => (
              <button
                key={pm}
                type="button"
                onClick={() => setPaymentMethod(pm)}
                style={{
                  padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                  border: paymentMethod === pm ? '2px solid #2186EB' : `1px solid ${isDark ? '#2D2D44' : '#E2E8F0'}`,
                  backgroundColor: paymentMethod === pm
                    ? (isDark ? 'rgba(33,134,235,0.15)' : 'rgba(33,134,235,0.08)')
                    : 'transparent',
                  color: paymentMethod === pm ? '#2186EB' : (isDark ? '#94A3B8' : '#64748B'),
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {pm}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {coin && parseFloat(amount) > 0 && (
          <div style={{
            padding: 16, borderRadius: 12, marginBottom: 20,
            backgroundColor: isDark ? 'rgba(33,134,235,0.08)' : 'rgba(33,134,235,0.04)',
            border: `1px solid ${isDark ? 'rgba(33,134,235,0.2)' : 'rgba(33,134,235,0.15)'}`,
          }}>
            <p style={{ margin: 0, fontSize: 13, color: isDark ? '#94A3B8' : '#64748B' }}>
              Resumen de la orden
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 16, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A' }}>
              {amount} {coin?.toUpperCase()} → {fiatAmount ? `$${fiatAmount} USD` : '...'}
            </p>
            {paymentMethod && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#2186EB' }}>
                vía {paymentMethod}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              flex: 1, padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              border: `1px solid ${isDark ? '#2D2D44' : '#E2E8F0'}`,
              backgroundColor: 'transparent',
              color: isDark ? '#94A3B8' : '#64748B', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            style={{
              flex: 2, padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              border: 'none',
              background: isValid ? 'linear-gradient(135deg, #2186EB 0%, #1A6BC7 100%)' : (isDark ? '#2D2D44' : '#E2E8F0'),
              color: isValid ? '#FFF' : '#94A3B8',
              cursor: isValid ? 'pointer' : 'not-allowed',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: isValid ? '0 4px 14px rgba(33,134,235,0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? 'Creando orden...' : 'Crear Orden P2P'}
          </button>
        </div>
      </div>
    </div>
  );
}
