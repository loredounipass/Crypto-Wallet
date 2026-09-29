import React from 'react';
import useP2POrderStatusLogic from './useP2POrderStatusLogic';

export default function P2POrderStatus({ status }) {
  const {
    config,
    STEPS,
    isTerminal,
    activeStep
  } = useP2POrderStatusLogic(status);

  return (
    <div>
      {/* Status Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '7px 16px', borderRadius: 20,
        backgroundColor: config.bg,
        color: config.color, fontSize: 13, fontWeight: 600,
        backdropFilter: 'blur(4px)',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          backgroundColor: config.color,
          animation: status === 'released' ? 'pulse 1.5s infinite' : 'none',
          boxShadow: `0 0 6px ${config.color}40`,
        }} />
        {config.label}
      </div>

      {/* Stepper */}
      {!isTerminal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 18 }}>
          {STEPS.map((step, i) => {
            const isActive = i <= activeStep;
            const isCurrent = i === activeStep;
            const isCompleted = i < activeStep;
            return (
              <React.Fragment key={step}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    backgroundColor: isActive ? '#7C3AED' : 'rgba(45,45,68,0.8)',
                    color: isActive ? '#FFF' : '#475569',
                    boxShadow: isCurrent
                      ? '0 0 0 3px rgba(124,58,237,0.2), 0 2px 8px rgba(124,58,237,0.3)'
                      : (isCompleted ? '0 1px 4px rgba(124,58,237,0.2)' : 'none'),
                    transition: 'all 0.3s ease',
                  }}>
                    {isCompleted ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span style={{
                    fontSize: 10, marginTop: 5, fontWeight: 600,
                    color: isActive ? '#E2E8F0' : '#475569',
                    letterSpacing: '0.02em',
                  }}>
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, marginTop: -16,
                    borderRadius: 1,
                    background: i < activeStep
                      ? 'linear-gradient(90deg, #7C3AED, #8B5CF6)'
                      : 'rgba(45,45,68,0.8)',
                    transition: 'background 0.3s ease',
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
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
