import React, { useState } from 'react';

const GRADIENT = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #2186EB 100%)';

const truncAddr = (addr) =>
    addr ? `${addr.slice(0, 10)}...${addr.slice(-8)}` : '—';

const formatDate = (d) =>
    d ? new Date(d).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

// MAPEO DE ESTADOS A ESTILOS PARA EL TIMELINE VISUAL DE LA ORDEN
const STATUS_LABELS = {
    pending: 'Pendiente',
    funded: 'Fondos en Escrow',
    buyer_paid: 'Pago Confirmado',
    released: 'Fondos Liberados',
    completed: 'Completada',
    cancelled: 'Cancelada',
    expired: 'Expirada',
    disputed: 'En Disputa',
};

const TimelineStep = ({ label, active, isLast, isCurrent, isDispute }) => (
    <div style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1 }}>
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            minWidth: 64,
        }}>
            <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: isDispute && isCurrent
                    ? 'rgba(245,158,11,0.2)'
                    : active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                border: isDispute && isCurrent
                    ? '2px solid #F59E0B'
                    : active ? '2px solid #6366F1' : '2px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12,
                boxShadow: isCurrent ? `0 0 12px ${isDispute ? '#F59E0B' : '#6366F1'}55` : 'none',
                transition: 'all 0.3s',
            }}>
                {isDispute && isCurrent ? '⚠️' : active ? '✓' : ''}
            </div>
            <span style={{
                fontSize: 9, fontWeight: 600, textAlign: 'center', maxWidth: 56,
                color: isCurrent ? (isDispute ? '#F59E0B' : '#A5B4FC') : active ? '#64748B' : '#334155',
                textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.3,
            }}>
                {label}
            </span>
        </div>
        {!isLast && (
            <div style={{
                flex: 1, height: 2, borderRadius: 2, margin: '0 4px',
                background: active
                    ? 'linear-gradient(90deg, #6366F1, rgba(99,102,241,0.3))'
                    : 'rgba(255,255,255,0.06)',
                marginBottom: 28,
            }} />
        )}
    </div>
);

// CONSTRUYE LA SECUENCIA DE ESTADOS QUE HA RECORRIDO LA ORDEN
const buildTimeline = (currentStatus) => {
    const disputeFlow = ['pending', 'funded', 'buyer_paid', 'disputed'];
    const idx = disputeFlow.indexOf(currentStatus);
    return disputeFlow.map((s, i) => ({
        key: s,
        label: STATUS_LABELS[s] || s,
        active: i <= (idx === -1 ? 1 : idx),
        isCurrent: s === currentStatus,
        isDispute: s === 'disputed',
    }));
};

const ActionButton = ({ id, label, description, color, accentColor, onClick, loading, disabled, icon }) => {
    const [confirming, setConfirming] = useState(false);

    const handleClick = () => {
        if (!confirming) {
            setConfirming(true);
            return;
        }
        setConfirming(false);
        onClick();
    };

    return (
        <div style={{
            flex: 1, border: `1px solid ${accentColor}33`,
            borderRadius: 14, padding: '16px',
            background: `${accentColor}08`,
            display: 'flex', flexDirection: 'column', gap: 8,
        }}>
            <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
                {description}
            </div>
            <button
                id={id}
                onClick={handleClick}
                disabled={disabled || loading}
                style={{
                    background: confirming
                        ? color
                        : `${accentColor}18`,
                    border: `1px solid ${accentColor}55`,
                    color: confirming ? '#fff' : accentColor,
                    borderRadius: 10,
                    padding: '11px 16px',
                    fontSize: 13, fontWeight: 700,
                    cursor: disabled || loading ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                    width: '100%',
                    boxShadow: confirming ? `0 4px 16px ${accentColor}44` : 'none',
                }}
            >
                {loading ? (
                    <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                ) : (
                    <>
                        <span>{icon}</span>
                        {confirming ? '¿Confirmar? Click de nuevo' : label}
                    </>
                )}
            </button>
            {confirming && !loading && (
                <button
                    onClick={() => setConfirming(false)}
                    style={{
                        background: 'none', border: 'none',
                        color: '#64748B', fontSize: 11,
                        cursor: 'pointer', padding: '2px 0', textAlign: 'center',
                    }}
                >
                    Cancelar
                </button>
            )}
        </div>
    );
};

export default function DisputeDetailModal({ dispute, onClose, onResolve, isLoading }) {
    if (!dispute) return null;

    const isResolved = dispute.isReverted || dispute.isAwarded;
    const timeline = buildTimeline(dispute.status);

    const InfoRow = ({ label, value, mono = false }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 600, textAlign: 'right', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>
                {value || '—'}
            </span>
        </div>
    );

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
            `}</style>

            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 9998,
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(6px)',
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px', pointerEvents: 'none',
            }}>
                <div style={{
                    background: '#0E0E1C',
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: 20,
                    width: '100%', maxWidth: 600,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    pointerEvents: 'all',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
                    animation: 'fadeIn 0.2s ease',
                }}>
                    {/* Modal Header */}
                    <div style={{
                        background: GRADIENT,
                        padding: '18px 24px',
                        borderRadius: '20px 20px 0 0',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                                Detalle de Disputa
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                                Orden #{dispute.orderId?.slice(0, 8).toUpperCase()}
                            </div>
                        </div>
                        <button
                            id="dispute-modal-close-btn"
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 10, color: '#fff', width: 36, height: 36,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16, fontWeight: 700,
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    <div style={{ padding: '24px' }}>

                        {/* Timeline */}
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                                Timeline de la Orden
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                {timeline.map((step, i) => (
                                    <TimelineStep
                                        key={step.key}
                                        label={step.label}
                                        active={step.active}
                                        isLast={i === timeline.length - 1}
                                        isCurrent={step.isCurrent}
                                        isDispute={step.isDispute}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Parties */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20,
                        }}>
                            {[
                                { role: 'Vendedor', email: dispute.sellerEmail, addr: dispute.sellerWalletAddress, accent: '#6366F1' },
                                { role: 'Proveedor', email: dispute.providerEmail, addr: dispute.providerWalletAddress, accent: '#8B5CF6' },
                            ].map(({ role, email, addr, accent }) => (
                                <div key={role} style={{
                                    background: '#080811', borderRadius: 12, padding: '14px',
                                    border: `1px solid ${accent}22`,
                                }}>
                                    <div style={{ fontSize: 10, color: accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                        {role}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#CBD5E1', fontWeight: 600, marginBottom: 4, wordBreak: 'break-all' }}>
                                        {email || '—'}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                        {truncAddr(addr)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order details */}
                        <div style={{
                            background: '#080811', borderRadius: 12, padding: '16px',
                            border: '1px solid rgba(255,255,255,0.05)', marginBottom: 20,
                        }}>
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                                Detalles de la Orden
                            </div>
                            <InfoRow label="Moneda" value={(dispute.coin || '').toUpperCase()} />
                            <InfoRow label="Monto Cripto" value={`${dispute.amount} ${(dispute.coin || '').toUpperCase()}`} />
                            <InfoRow label="Monto Fiat" value={dispute.fiatAmount ? `$${dispute.fiatAmount}` : '—'} />
                            <InfoRow label="Método de Pago" value={dispute.paymentMethod} />
                            <InfoRow label="Chain ID" value={dispute.chainId} />
                            <InfoRow label="TX Escrow" value={dispute.escrowTxHash} mono />
                            <InfoRow label="Creada" value={formatDate(dispute.createdAt)} />
                            <InfoRow label="Expiraba" value={formatDate(dispute.expiresAt)} />
                        </div>

                        {/* Dispute reason */}
                        {dispute.disputeReason && (
                            <div style={{
                                background: 'rgba(245,158,11,0.06)',
                                border: '1px solid rgba(245,158,11,0.2)',
                                borderLeft: '4px solid #F59E0B',
                                borderRadius: 10, padding: '14px 16px', marginBottom: 20,
                            }}>
                                <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                    Motivo de la Disputa
                                    {dispute.disputeOpenedBy && (
                                        <span style={{ color: '#64748B', fontWeight: 500, textTransform: 'none', letterSpacing: 0, marginLeft: 8 }}>
                                            (abierta por: {dispute.disputeOpenedBy})
                                        </span>
                                    )}
                                </div>
                                <p style={{ margin: 0, fontSize: 13, color: '#D1D5DB', lineHeight: 1.6 }}>
                                    {dispute.disputeReason}
                                </p>
                            </div>
                        )}

                        {/* Resolution status */}
                        {isResolved && (
                            <div style={{
                                background: 'rgba(16,185,129,0.08)',
                                border: '1px solid rgba(16,185,129,0.25)',
                                borderRadius: 10, padding: '14px 16px', marginBottom: 20,
                                display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                <span style={{ fontSize: 20 }}>✅</span>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>
                                        Disputa ya resuelta
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748B' }}>
                                        {dispute.isReverted ? 'Fondos revertidos al vendedor' : 'Fondos premiados al proveedor'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        {!isResolved && (
                            <>
                                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                                    Resolución del Administrador
                                </div>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <ActionButton
                                        id={`resolve-revert-btn-${dispute.orderId}`}
                                        icon="↩"
                                        label="Revertir — Devolver al Vendedor"
                                        description="Los fondos en escrow serán devueltos al vendedor. El proveedor no recibirá nada."
                                        color="#EF4444"
                                        accentColor="#EF4444"
                                        onClick={() => onResolve(dispute.orderId, 'revert')}
                                        loading={isLoading}
                                        disabled={false}
                                    />
                                    <ActionButton
                                        id={`resolve-award-btn-${dispute.orderId}`}
                                        icon="🏆"
                                        label="Premiar — Enviar al Proveedor"
                                        description="Los fondos en escrow serán transferidos al proveedor. El vendedor no recibirá reembolso."
                                        color="#10B981"
                                        accentColor="#10B981"
                                        onClick={() => onResolve(dispute.orderId, 'award')}
                                        loading={isLoading}
                                        disabled={false}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
