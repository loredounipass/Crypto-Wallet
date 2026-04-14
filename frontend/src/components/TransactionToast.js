import React from 'react';
import { CheckCircle, Close } from '../ui/icons';
import { useThemeMode } from '../ui/styles';

export default function TransactionToast({ toast, onClose }) {
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';

    if (!toast) return null;

    const isDeposit = toast.kind === 'deposit';
    const accent = isDeposit ? '#22C55E' : '#EF4444';
    const background = isDark ? '#1A1A2E' : '#FFFFFF';
    const border = isDark ? '#2D2D44' : '#E5E7EB';
    const text = isDark ? '#FFFFFF' : '#111827';
    const subtitle = isDeposit ? 'Entrada confirmada en tu wallet' : 'Salida confirmada en tu wallet';

    return (
        <div
            style={{
                position: 'fixed',
                right: '20px',
                bottom: '20px',
                zIndex: 1200,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '280px',
                maxWidth: '360px',
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: background,
                border: `1px solid ${border}`,
                borderLeft: `4px solid ${accent}`,
                boxShadow: isDark
                    ? '0 10px 24px rgba(0,0,0,0.45)'
                    : '0 10px 24px rgba(15,23,42,0.16)'
            }}
        >
            <CheckCircle sx={{ color: accent, fontSize: 22 }} />
            <div style={{ flex: 1 }}>
                <div style={{ color: text, fontSize: '14px', fontWeight: 700 }}>
                    {toast.message}
                </div>
                <div style={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: '12px', marginTop: '2px' }}>
                    {subtitle}
                </div>
            </div>
            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar notificacion"
                style={{
                    border: 'none',
                    background: 'transparent',
                    color: isDark ? '#9CA3AF' : '#6B7280',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                }}
            >
                <Close sx={{ fontSize: 18 }} />
            </button>
        </div>
    );
}
