import React, { useState, useEffect, useCallback } from 'react';
import useEscrow from '../hooks/useEscrow';
import DisputeStatsBar from '../components/p2p/admin/DisputeStatsBar';
import DisputeCard from '../components/p2p/admin/DisputeCard';
import DisputeDetailModal from '../components/p2p/admin/DisputeDetailModal';
import TransactionToast from '../components/TransactionToast';

export default function AdminDisputes() {
    const { getDisputedOrders, resolveDispute, isLoading, toast, dismissToast } = useEscrow();

    const [disputes, setDisputes] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [selectedDispute, setSelectedDispute] = useState(null);

    const loadDisputes = useCallback(async () => {
        setFetching(true);
        try {
            const data = await getDisputedOrders();
            if (Array.isArray(data)) {
                setDisputes(data);
            }
        } catch (e) {
            console.error('Failed to load disputed orders:', e);
        } finally {
            setFetching(false);
        }
    }, [getDisputedOrders]);

    useEffect(() => {
        loadDisputes();
    }, [loadDisputes]);

    const handleResolve = async (orderId, type) => {
        try {
            const res = await resolveDispute(orderId, type);
            if (res && res.orderId) {
                // Update local state to reflect resolution without full refetch immediately
                setDisputes(prev => prev.map(d => {
                    if (d.orderId === orderId) {
                        return { ...d, isReverted: type === 'revert', isAwarded: type === 'award' };
                    }
                    return d;
                }));
                
                // Also update the selected dispute so the modal reflects the change
                setSelectedDispute(prev => {
                    if (prev && prev.orderId === orderId) {
                         return { ...prev, isReverted: type === 'revert', isAwarded: type === 'award' };
                    }
                    return prev;
                });
            }
        } catch (e) {
            // Handled by hook (toast)
        }
    };

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.5px' }}>
                        Admin: Disputas P2P
                    </h1>
                    <p style={{ margin: '6px 0 0', fontSize: 14, color: '#94A3B8' }}>
                        Gestión y resolución de conflictos de órdenes en Escrow
                    </p>
                </div>
                <button
                    onClick={loadDisputes}
                    disabled={fetching}
                    style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#CBD5E1', borderRadius: 10, padding: '10px 20px',
                        fontSize: 13, fontWeight: 600, cursor: fetching ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all 0.2s', opacity: fetching ? 0.7 : 1,
                    }}
                >
                    <svg
                        viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ animation: fetching ? 'spin 1s linear infinite' : 'none' }}
                    >
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    Refrescar
                </button>
            </div>

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>

            {/* Stats */}
            <DisputeStatsBar disputes={disputes} />

            {/* List */}
            {fetching && disputes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
                    <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Cargando disputas...</div>
                </div>
            ) : disputes.length === 0 ? (
                <div style={{
                    background: '#080811', border: '1px dashed rgba(255,255,255,0.1)',
                    borderRadius: 16, padding: '60px 20px', textAlign: 'center',
                }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                    <div style={{ fontSize: 16, color: '#F1F5F9', fontWeight: 600, marginBottom: 4 }}>
                        Bandeja Limpia
                    </div>
                    <div style={{ fontSize: 14, color: '#64748B' }}>
                        No hay ninguna orden en disputa en este momento.
                    </div>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: 20,
                }}>
                    {disputes.map(dispute => (
                        <DisputeCard
                            key={dispute.orderId}
                            dispute={dispute}
                            onViewDetail={setSelectedDispute}
                        />
                    ))}
                </div>
            )}

            {/* Detail & Resolution Modal */}
            <DisputeDetailModal
                dispute={selectedDispute}
                onClose={() => setSelectedDispute(null)}
                onResolve={handleResolve}
                isLoading={isLoading}
            />

            <TransactionToast toast={toast} onClose={dismissToast} />
        </div>
    );
}
