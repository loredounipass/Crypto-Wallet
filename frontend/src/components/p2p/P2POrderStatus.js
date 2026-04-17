import React from 'react';
import { useThemeMode } from '../../ui/styles';

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', step: 0 },
  funded:     { label: 'Fondos en Escrow', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', step: 1 },
  buyer_paid: { label: 'Pago Confirmado', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', step: 2 },
  released:   { label: 'Liberando', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', step: 3 },
  completed:  { label: 'Completado', color: '#10B981', bg: 'rgba(16,185,129,0.12)', step: 4 },
  disputed:   { label: 'En Disputa', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', step: -1 },
  refunded:   { label: 'Reembolsado', color: '#6B7280', bg: 'rgba(107,114,128,0.12)', step: -1 },
  cancelled:  { label: 'Cancelado', color: '#6B7280', bg: 'rgba(107,114,128,0.12)', step: -1 },
  expired:    { label: 'Expirado', color: '#6B7280', bg: 'rgba(107,114,128,0.12)', step: -1 },
};

const STEPS = ['Escrow', 'Pago', 'Liberación', 'Completado'];

export default function P2POrderStatus({ status }) {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const isTerminal = config.step === -1;
  const activeStep = isTerminal ? -1 : config.step;

  return (
    <div>
      {/* Status Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 20,
        backgroundColor: config.bg,
        color: config.color, fontSize: 13, fontWeight: 600,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          backgroundColor: config.color,
          animation: status === 'released' ? 'pulse 1.5s infinite' : 'none',
        }} />
        {config.label}
      </div>

      {/* Stepper */}
      {!isTerminal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 16 }}>
          {STEPS.map((step, i) => {
            const isActive = i <= activeStep;
            const isCurrent = i === activeStep;
            return (
              <React.Fragment key={step}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    backgroundColor: isActive ? '#2186EB' : (isDark ? '#2D2D44' : '#E2E8F0'),
                    color: isActive ? '#FFF' : (isDark ? '#64748B' : '#94A3B8'),
                    border: isCurrent ? '2px solid #2186EB' : 'none',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(33,134,235,0.2)' : 'none',
                    transition: 'all 0.3s ease',
                  }}>
                    {isActive && i < activeStep ? '✓' : i + 1}
                  </div>
                  <span style={{
                    fontSize: 10, marginTop: 4, fontWeight: 500,
                    color: isActive ? (isDark ? '#E2E8F0' : '#1E293B') : (isDark ? '#475569' : '#94A3B8'),
                  }}>
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, marginTop: -16,
                    backgroundColor: i < activeStep ? '#2186EB' : (isDark ? '#2D2D44' : '#E2E8F0'),
                    transition: 'background-color 0.3s ease',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
