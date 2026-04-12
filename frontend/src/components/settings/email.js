import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../hooks/AuthContext'; 
import useAuth from '../../hooks/useAuth'; 

const EmailVerificationStatus = () => {
    const { auth } = useContext(AuthContext); 
    const { isEmailVerified } = useAuth(); 

    const [verificationStatus, setVerificationStatus] = useState(null);
    const [loading, setLoading] = useState(true); 
    const [localError, setLocalError] = useState(null);

    useEffect(() => {
        const checkEmailVerification = async () => {
            setLocalError(null); 
            try {
                const isVerified = await isEmailVerified(); 

                if (isVerified) {
                    setVerificationStatus({
                        verified: true,
                        message: 'Correo electrónico verificado con éxito.',
                    });
                } else {
                    setVerificationStatus({
                        verified: false,
                        message: 'El correo electrónico no está verificado.',
                    });
                }
            } catch (err) {
                setLocalError(err.message || 'Error al verificar el correo.');
                setVerificationStatus(null); 
            } finally {
                setLoading(false); 
            }
        };

        if (auth && auth.email) {
            checkEmailVerification(); 
        } else {
            setLocalError('No se ha encontrado un correo electrónico autenticado.');
            setLoading(false); 
        }
    }, [auth, isEmailVerified]); 

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
