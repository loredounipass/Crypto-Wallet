import React from 'react';
import useEmailVerificationStatusLogic from './useEmailVerificationStatusLogic';
const EmailVerificationStatus = () => {
    const {
        auth,
        verificationStatus,
        loading,
        localError
    } = useEmailVerificationStatusLogic();

    return (
        <div className="settings-full-page">
            <div className="settings-section-wrapper">
                <h1 className="settings-title" style={{ marginBottom: '1rem' }}>
                    Verificar Estado del Correo Electrónico
                </h1>
                <p className="settings-text-secondary">
                    Correo electrónico autenticado: <strong style={{ color: 'white' }}>{auth?.email || 'Correo no disponible'}</strong>
                </p>
                
                {loading ? (
                    <div className="settings-spinner-container">
                        <div className="settings-spinner"></div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {localError && (
                            <div className="settings-alert settings-alert-error">
                                {localError}
                            </div>
                        )}
                        {verificationStatus && (
                            <div className={`settings-verify-status-box ${verificationStatus.verified 
                                    ? 'settings-verify-status-success' 
                                    : 'settings-verify-status-warning'}`}>
                                {verificationStatus.message}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailVerificationStatus;
