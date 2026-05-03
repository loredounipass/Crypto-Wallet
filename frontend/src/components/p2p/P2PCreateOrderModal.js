import React, { useEffect, useMemo, useState } from 'react';

import useAllWallets from '../../hooks/useAllWallets';
import Price from '../../services/price';

const PAYMENT_METHODS = [
  'Transferencia Bancaria', 'Zelle', 'PayPal', 'Nequi',
  'Mercado Pago', 'Efectivo', 'Otro'
];

export default function P2PCreateOrderModal({ open, onClose, provider, onSubmit, isLoading }) {
  
  
  const { allWalletInfo: wallets } = useAllWallets();
  const shouldRender = Boolean(open && provider);

  const [coin, setCoin] = useState('');
  const [amount, setAmount] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [coinPriceUsd, setCoinPriceUsd] = useState(0);

  const availablePaymentMethods = provider?.paymentMethods?.length > 0
    ? provider.paymentMethods
    : PAYMENT_METHODS;

  const selectedWallet = wallets?.find(w => w.coin?.toUpperCase() === coin?.toUpperCase());
  const balance = selectedWallet?.balance || 0;
  // Gas buffer: pequeño margen para el gas on-chain estimado en el backend
  const gasBuffer = useMemo(() => (coin ? 0.001 : 0), [coin]);
  const availableAfterFee = useMemo(() => Math.max(0, Number(balance || 0) - Number(gasBuffer || 0)), [balance, gasBuffer]);

  const truncateToDecimals = (value, decimals = 8) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    const factor = 10 ** decimals;
    return Math.floor(numeric * factor) / factor;
  };

  const formatTrimmed = (value, decimals = 8) => {
    const truncated = truncateToDecimals(value, decimals);
    if (!truncated) return '';
    return truncated.toFixed(decimals).replace(/\.?0+$/, '');
  };

  useEffect(() => {
    let isMounted = true;
    async function loadPrice() {
      if (!coin) {
        if (isMounted) setCoinPriceUsd(0);
        return;
      }
      try {
        const { data } = await Price.getPrice(coin);
        if (isMounted) setCoinPriceUsd(Number(data?.USD || 0));
      } catch (_) {
        if (isMounted) setCoinPriceUsd(0);
      }
    }
    loadPrice();
    return () => { isMounted = false; };
  }, [coin]);

  useEffect(() => {
    const qty = Number(amount || 0);
    if (!qty || !coinPriceUsd) {
      setFiatAmount('');
      return;
    }
    const totalUsd = truncateToDecimals(qty * coinPriceUsd, 2);
    setFiatAmount(totalUsd ? totalUsd.toFixed(2) : '');
  }, [amount, coinPriceUsd]);

  const isValid = coin && parseFloat(amount) > 0 && parseFloat(fiatAmount) > 0
    && paymentMethod && parseFloat(amount) <= availableAfterFee;

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

  const handleSetMax = () => {
    if (!coin || availableAfterFee <= 0) return;
    setAmount(formatTrimmed(availableAfterFee, 8));
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
    border: `1px solid ${'#2D2D44'}`,
    backgroundColor: '#0F0F1A',
    color: '#E2E8F0',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6,
    color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  if (!shouldRender) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 500, borderRadius: 16, padding: 28,
        backgroundColor: '#1E1E2E',
        border: `1px solid ${'#2D2D44'}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#F1F5F9' }}>
              Vender P2P
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>
              Proveedor: <span style={{ color: '#8B5CF6', fontWeight: 600 }}>{provider.firstName} {provider.lastName}</span>
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 22,
            color: '#64748B', cursor: 'pointer',
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
                Disponible: <span style={{ color: '#8B5CF6' }}>{truncateToDecimals(availableAfterFee, 8).toFixed(8)} {coin?.toUpperCase()}</span>
              </span>
            )}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={handleSetMax}
              disabled={!coin || availableAfterFee <= 0}
              style={{
                border: `1px solid ${'#2D2D44'}`,
                backgroundColor: '#0F0F1A',
                color: '#8B5CF6',
                borderRadius: 10,
                padding: '0 14px',
                fontWeight: 700,
                cursor: !coin || availableAfterFee <= 0 ? 'not-allowed' : 'pointer',
                opacity: !coin || availableAfterFee <= 0 ? 0.6 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              Max
            </button>
          </div>
          {selectedWallet && (
          <p style={{ color: '#94A3B8', fontSize: 12, margin: '6px 0 0' }}>
              Balance: {truncateToDecimals(balance, 8).toFixed(8)} {coin?.toUpperCase()} <br/>
              Gas reservado: ~{gasBuffer.toFixed(6)} {coin?.toUpperCase()} (estimado)
            </p>
          )}
          {parseFloat(amount) > availableAfterFee && availableAfterFee >= 0 && (
            <p style={{ color: '#EF4444', fontSize: 12, margin: '4px 0 0' }}>
              Balance insuficiente (considerando comisión y gas)
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
            readOnly
            placeholder="0.00"
            style={{ ...inputStyle, opacity: 0.9 }}
          />
          {coin && (
            <p style={{ color: '#94A3B8', fontSize: 12, margin: '6px 0 0' }}>
              Precio actual: {coinPriceUsd ? `$${coinPriceUsd}` : 'No disponible'} por {coin.toUpperCase()}
            </p>
          )}
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
                  border: paymentMethod === pm ? '2px solid #8B5CF6' : `1px solid ${'#2D2D44'}`,
                  backgroundColor: paymentMethod === pm
                    ? ('rgba(139,92,246,0.15)')
                    : 'transparent',
                  color: paymentMethod === pm ? '#8B5CF6' : ('#94A3B8'),
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
            backgroundColor: 'rgba(139,92,246,0.08)',
            border: `1px solid ${'rgba(139,92,246,0.2)'}`,
          }}>
            <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>
              Resumen de la orden
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>
              {amount} {coin?.toUpperCase()} → {fiatAmount ? `$${fiatAmount} USD` : '...'}
            </p>
            {paymentMethod && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#8B5CF6' }}>
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
              border: `1px solid ${'#2D2D44'}`,
              backgroundColor: 'transparent',
              color: '#94A3B8', cursor: 'pointer',
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
              background: isValid ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' : ('#2D2D44'),
              color: isValid ? '#FFF' : '#94A3B8',
              cursor: isValid ? 'pointer' : 'not-allowed',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: isValid ? '0 4px 14px rgba(139,92,246,0.3)' : 'none',
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
