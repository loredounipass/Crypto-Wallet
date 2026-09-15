import React from 'react';

// FORMATEA EL TIEMPO RELATIVO DESDE UNA FECHA HASTA AHORA
const timeAgo = (dateStr) => {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `hace ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h}h`;
    return `hace ${Math.floor(h / 24)}d`;
};

const truncate = (str, len = 36) =>
    str && str.length > len ? str.slice(0, len) + '...' : (str || '—');

const StatusBadge = ({ resolved }) => (
    <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: resolved ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
        color: resolved ? '#10B981' : '#F59E0B',
        border: `1px solid ${resolved ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
    }}>
        <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: resolved ? '#10B981' : '#F59E0B',
            animation: resolved ? 'none' : 'pulse 1.5s infinite',
        }} />
        {resolved ? 'Resuelta' : 'En Disputa'}
    </span>
);

export default function DisputeCard({ dispute, onViewDetail }) {
    const isResolved = dispute.isReverted || dispute.isAwarded;
    const shortId = dispute.orderId ? dispute.orderId.slice(0, 8).toUpperCase() : '—';

    return (
        <>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                .dispute-card:hover {
                    border-color: rgba(99,102,241,0.4) !important;
                    transform: translateY(-1px);
                    box-shadow: 0 8px 32px rgba(99,102,241,0.12) !important;
                }
                .dispute-card {
                    transition: all 0.2s ease !important;
                }
                .detail-btn:hover {
                    background: linear-gradient(135deg, #6366F1, #8B5CF6) !important;
                    color: #fff !important;
                }
            `}</style>

            <div
                className="dispute-card"
                style={{
                    background: 'linear-gradient(180deg, #131327 0%, #0C0C17 100%)',
                    border: '1px solid rgba(99,102,241,0.15)',
                    borderRadius: 16,
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    cursor: 'default',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
            >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                            fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                            color: '#A5B4FC', background: 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            padding: '3px 10px', borderRadius: 8,
                        }}>
                            #{shortId}
                        </span>
                        <StatusBadge resolved={isResolved} />
                    </div>
                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
                        {timeAgo(dispute.updatedAt || dispute.createdAt)}
                    </span>
                </div>

                {/* Parties */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                }}>
                    <div style={{
                        background: '#080811', borderRadius: 10, padding: '10px 14px',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                        <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Vendedor
                        </div>
                        <div style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 600, wordBreak: 'break-all' }}>
                            {truncate(dispute.sellerEmail, 28)}
                        </div>
                    </div>
                    <div style={{
                        background: '#080811', borderRadius: 10, padding: '10px 14px',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                        <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Proveedor
                        </div>
                        <div style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 600, wordBreak: 'break-all' }}>
                            {truncate(dispute.providerEmail, 28)}
                        </div>
                    </div>
                </div>

                {/* Order summary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{
                            fontSize: 22, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.5px',
                        }}>
                            {dispute.amount}
                        </span>
                        <span style={{
                            fontSize: 13, fontWeight: 700, color: '#8B5CF6',
                            background: 'rgba(139,92,246,0.12)',
                            padding: '2px 8px', borderRadius: 6,
                        }}>
                            {(dispute.coin || '').toUpperCase()}
                        </span>
                    </div>
                    {dispute.fiatAmount && (
                        <span style={{ fontSize: 14, color: '#4ADE80', fontWeight: 600 }}>
                            ≈ ${dispute.fiatAmount}
                        </span>
                    )}
                    {dispute.paymentMethod && (
                        <span style={{
                            fontSize: 12, color: '#64748B',
                            background: 'rgba(255,255,255,0.04)',
                            padding: '3px 10px', borderRadius: 20,
                            border: '1px solid rgba(255,255,255,0.07)',
                        }}>
                            {dispute.paymentMethod}
                        </span>
                    )}
                </div>

                {/* Dispute reason */}
                {dispute.disputeReason && (
                    <div style={{
                        background: 'rgba(245,158,11,0.06)',
                        border: '1px solid rgba(245,158,11,0.15)',
                        borderLeft: '3px solid #F59E0B',
                        borderRadius: 8, padding: '10px 14px',
                    }}>
                        <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Motivo
                        </div>
                        <div style={{ fontSize: 13, color: '#D1D5DB', lineHeight: 1.5 }}>
                            {truncate(dispute.disputeReason, 120)}
                        </div>
                    </div>
                )}

                {/* Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                    <button
                        id={`dispute-detail-btn-${dispute.orderId}`}
                        className="detail-btn"
                        onClick={() => onViewDetail(dispute)}
                        style={{
                            background: 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.3)',
                            color: '#A5B4FC',
                            borderRadius: 10,
                            padding: '9px 20px',
                            fontSize: 13, fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'all 0.2s',
                        }}
                    >
                        Ver Detalle
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
}
