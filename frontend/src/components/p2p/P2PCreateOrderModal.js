import React, { useEffect, useMemo, useState } from 'react';

import useAllWallets from '../../hooks/useAllWallets';
import Price from '../../services/price';


export default function P2PCreateOrderModal({ open, onClose, provider, onSubmit, isLoading }) {
  const isMounted = React.useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const { allWalletInfo: wallets } = useAllWallets();
  const shouldRender = Boolean(open && provider);

  const compatibleWallets = useMemo(() => {
    if (!wallets || !provider?.destinationWallets) return [];
    return wallets.filter(w => provider.destinationWallets.some(dw => dw.coin?.toUpperCase() === w.coin?.toUpperCase() && dw.enabled));
  }, [wallets, provider]);

  const [coin, setCoin] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [coinPriceUsd, setCoinPriceUsd] = useState(0);

  const availablePaymentMethods = provider?.paymentMethods?.length > 0
    ? provider.paymentMethods.map(pm => 
        (pm === 'Transferencia Bancaria' && provider.preferredBank)
          ? provider.preferredBank
          : pm
      )
    : ['Transferencia Bancaria'];

  const selectedWallet = wallets?.find(w => w.coin?.toUpperCase() === coin?.toUpperCase());
  const balance = selectedWallet?.balance || 0;
  const availableAfterFee = useMemo(() => Math.max(0, Number(balance || 0)), [balance]);

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

  const fiatAmount = useMemo(() => {
    const qty = Number(amount || 0);
    if (!qty || !coinPriceUsd) return '';
    const totalUsd = truncateToDecimals(qty * coinPriceUsd, 2);
    return totalUsd ? totalUsd.toFixed(2) : '';
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
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    fontSize: 14,
    border: '1px solid #1F1F33',
    backgroundColor: '#080811',
    color: '#E2E8F0',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 8,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  };

  if (!shouldRender) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 480, borderRadius: 20, padding: '28px 28px 24px',
        background: 'linear-gradient(180deg, #131327 0%, #0C0C17 100%)',
        border: '1px solid #1F1F33',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.05)',
        maxHeight: '90vh', overflowY: 'auto',
        margin: '0 16px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.3px' }}>
              Vender P2P
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94A3B8' }}>
              Proveedor: <span style={{ color: '#8B5CF6', fontWeight: 600 }}>{provider.firstName} {provider.lastName}</span>
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', border: 'none',
            fontSize: 16, color: '#64748B', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#E2E8F0'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#64748B'; }}
          >✕</button>
        </div>

        {/* Coin Select */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Criptomoneda</label>
          <select
            value={coin}
            onChange={e => setCoin(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36 }}
          >
            <option value="">Seleccionar crypto...</option>
            {compatibleWallets.length === 0 ? (
              <option value="" disabled>No tienes wallets compatibles</option>
            ) : (
              compatibleWallets.map(w => (
                <option key={w.coin} value={w.coin}>
                  {w.coin?.toUpperCase()} — Balance: {w.balance?.toFixed(6)}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>
            Cantidad a vender
            {selectedWallet && (
              <span style={{ float: 'right', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>
                Disponible: <span style={{ color: '#8B5CF6' }}>{truncateToDecimals(availableAfterFee, 8).toFixed(8)} {coin?.toUpperCase()}</span>
              </span>
            )}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              style={{ ...inputStyle, paddingRight: 62 }}
            />
            <button
              type="button"
              onClick={handleSetMax}
              disabled={!coin || availableAfterFee <= 0}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(139,92,246,0.15)',
                border: 'none',
                color: '#8B5CF6',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.3px',
                cursor: !coin || availableAfterFee <= 0 ? 'not-allowed' : 'pointer',
                opacity: !coin || availableAfterFee <= 0 ? 0.4 : 1,
                transition: 'all 0.15s',
              }}
            >
              MAX
            </button>
          </div>
          {parseFloat(amount) > availableAfterFee && availableAfterFee >= 0 && (
            <p style={{ color: '#EF4444', fontSize: 11, margin: '6px 0 0', fontWeight: 500 }}>
              ⚠ Balance insuficiente
            </p>
          )}
        </div>

        {/* Fiat Amount */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Monto en USD</label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              step="any"
              min="0"
              value={fiatAmount}
              readOnly
              placeholder="0.00"
              style={{ ...inputStyle, opacity: 0.85, paddingLeft: 28 }}
            />
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: '#64748B', fontSize: 14, fontWeight: 600, pointerEvents: 'none',
            }}>$</span>
          </div>
          {coin && (
            <p style={{ color: '#64748B', fontSize: 11, margin: '6px 0 0' }}>
              1 {coin.toUpperCase()} = {coinPriceUsd ? `$${coinPriceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
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
                  padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                  border: paymentMethod === pm ? '1.5px solid #8B5CF6' : '1px solid #1F1F33',
                  backgroundColor: paymentMethod === pm
                    ? 'rgba(139,92,246,0.12)'
                    : 'rgba(255,255,255,0.02)',
                  color: paymentMethod === pm ? '#A78BFA' : '#94A3B8',
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
            padding: '14px 16px', borderRadius: 12, marginBottom: 20,
            backgroundColor: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.15)',
          }}>
            <p style={{ margin: 0, fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
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
              flex: 1, padding: '13px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              border: '1px solid #1F1F33',
              backgroundColor: 'transparent',
              color: '#94A3B8', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            style={{
              flex: 2, padding: '13px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              border: 'none',
              background: isValid ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' : '#1F1F33',
              color: isValid ? '#FFF' : '#64748B',
              cursor: isValid ? 'pointer' : 'not-allowed',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: isValid ? '0 4px 20px rgba(139,92,246,0.3)' : 'none',
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
