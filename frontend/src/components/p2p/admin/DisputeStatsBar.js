import React from 'react';

const StatCard = ({ label, value, accent, icon }) => (
    <div style={{
        flex: 1,
        minWidth: 0,
        background: 'linear-gradient(135deg, #131327 0%, #0C0C17 100%)',
        border: `1px solid ${accent}33`,
        borderRadius: 14,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: `0 4px 20px ${accent}11`,
    }}>
        <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${accent}18`,
            border: `1px solid ${accent}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
        }}>
            {icon}
        </div>
        <div style={{ minWidth: 0 }}>
            <div style={{
                fontSize: 26, fontWeight: 800,
                color: '#F1F5F9', lineHeight: 1.1,
                letterSpacing: '-0.5px',
            }}>
                {value}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: 500 }}>
                {label}
            </div>
        </div>
    </div>
);

// CALCULA LA DISPUTA MAS ANTIGUA EN DIAS/HORAS PARA PRIORIZAR RESOLUCION
const getOldestDisputeAge = (disputes) => {
    if (!disputes || disputes.length === 0) return '—';
    const dates = disputes
        .map(d => d.updatedAt || d.createdAt)
        .filter(Boolean)
        .map(d => new Date(d).getTime());
    if (dates.length === 0) return '—';
    const oldest = Math.min(...dates);
    const diffMs = Date.now() - oldest;
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 24) return `${diffH}h`;
    return `${Math.floor(diffH / 24)}d`;
};

export default function DisputeStatsBar({ disputes = [] }) {
    const total = disputes.length;
    const pending = disputes.filter(d => !d.isReverted && !d.isAwarded).length;
    const resolved = disputes.filter(d => d.isReverted || d.isAwarded).length;
    const oldest = getOldestDisputeAge(
        disputes.filter(d => !d.isReverted && !d.isAwarded)
    );

    return (
        <div style={{
            display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap',
        }}>
            <StatCard
                label="Disputas activas"
                value={total}
                accent="#F59E0B"
                icon="⚠️"
            />
            <StatCard
                label="Sin resolver"
                value={pending}
                accent="#EF4444"
                icon="🔴"
            />
            <StatCard
                label="Resueltas"
                value={resolved}
                accent="#10B981"
                icon="✅"
            />
            <StatCard
                label="Más antigua"
                value={oldest}
                accent="#6366F1"
                icon="⏱️"
            />
        </div>
    );
}
