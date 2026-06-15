import React from 'react';
import { CheckCircle, Close, WarningAmber } from '../ui/icons';


export default function TransactionToast({ toast, onClose }) {
    

    if (!toast) return null;

    const isDeposit = toast.kind === 'deposit' || toast.kind === 'success';
    const accent = isDeposit ? '#22C55E' : '#EF4444';
    const background = '#1A1A2E';
    const border = '#2D2D44';
    const text = '#FFFFFF';
    
    let subtitle = toast.subtitle;
    if (!subtitle) {
        if (toast.kind === 'deposit') subtitle = 'Entrada confirmada en tu wallet';
        else if (toast.kind === 'withdraw') subtitle = 'Salida confirmada en tu wallet';
        else if (toast.kind === 'success') subtitle = 'Operación exitosa';
        else if (toast.kind === 'error') subtitle = 'Se produjo un error';
        else subtitle = 'Notificación';
    }

    const Icon = isDeposit ? CheckCircle : WarningAmber;

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
                boxShadow: '0 10px 24px rgba(0,0,0,0.45)'
            }}
        >
            <Icon sx={{ color: accent, fontSize: 22 }} />
            <div style={{ flex: 1 }}>
                <div style={{ color: text, fontSize: '14px', fontWeight: 700 }}>
                    {toast.message}
                </div>
                <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '2px' }}>
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
                    color: '#9CA3AF',
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