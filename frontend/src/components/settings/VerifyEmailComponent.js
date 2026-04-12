import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../../hooks/AuthContext'; 
import useAuth from '../../hooks/useAuth'; 
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';

const VerifyEmailComponent = () => {
    const { auth } = useContext(AuthContext); 
    const { sendVerificationEmail, isEmailVerified, error } = useAuth(); 

    const [verificationStatus, setVerificationStatus] = useState(null);
    const [loading, setLoading] = useState(true); 
    const [localError, setLocalError] = useState(null);
    const [emailVerified, setEmailVerified] = useState(false);
    const [hasCheckedVerification, setHasCheckedVerification] = useState(false); 
    const [sending, setSending] = useState(false); 
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: '' });

    useEffect(() => {
        const checkEmailVerification = async () => {
            setLocalError(null); 
            try {
                const isVerified = await isEmailVerified(); 

                if (isVerified) {
                    setVerificationStatus({
                        verified: true,
                        message: 'Correo electrónico verificado',
                    });
                    setEmailVerified(true);
                } else {
                    setVerificationStatus({
                        verified: false,
                        message: 'El correo electrónico no está verificado.',
                    });
                    setEmailVerified(false);
                }
            } catch (err) {
                setLocalError(err.message || 'Error al verificar el correo.');
                setVerificationStatus(null); 
            } finally {
                setLoading(false); 
                setHasCheckedVerification(true); 
            }
        };

        if (auth && auth.email && !hasCheckedVerification) {
            checkEmailVerification(); 
        } else if (!auth || !auth.email) {
            setLocalError('No se ha encontrado un correo electrónico autenticado.');
            setLoading(false); 
        }
    }, [auth, isEmailVerified, hasCheckedVerification]); 

    const handleSendVerificationEmail = async () => {
        if (auth && auth.email) {
            setSending(true); 
            try {
                await sendVerificationEmail(auth.email);
                setSnackbar({ open: true, message: "Correo de verificación enviado.", severity: "success" });
            } catch (error) {
                const msg = error.message || 'Error al enviar el correo de verificación.';
                setLocalError(msg);
                setSnackbar({ open: true, message: msg, severity: "error" });
            } finally {
                setSending(false); 
            }
        }
    };

    const handleCloseSnackbar = useCallback(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    useEffect(() => {
        if (snackbar.open) {
            const timer = setTimeout(handleCloseSnackbar, 4000);
            return () => clearTimeout(timer);
        }
    }, [snackbar.open, handleCloseSnackbar]);

    return (
        <div className="settings-verify-container">
            <div className="settings-section-header">
                <div className="settings-large-icon">
                    <EmailOutlinedIcon className="settings-large-icon-inner" />
                </div>
                <h2 className="settings-title">Verificar correo electrónico</h2>
            </div>

            <div className="settings-verify-info-box">
                <EmailOutlinedIcon style={{ color: 'var(--settings-muted)' }} />
                <p style={{ color: 'var(--settings-muted)', margin: 0 }}>
                    Correo autenticado: <span style={{ fontWeight: 700, color: 'var(--settings-text)' }}>{auth?.email || 'Correo no disponible'}</span>
                </p>
            </div>

            {loading ? (
                <div className="settings-spinner-container">
                    <div className="settings-spinner"></div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {localError && (
                        <div className="settings-alert settings-alert-error">
                            {localError}
                        </div>
                    )}

                    {verificationStatus && (
                        <div className={`settings-verify-status-box ${verificationStatus.verified 
                                ? 'settings-verify-status-success' 
                                : 'settings-verify-status-warning'}`}>
                            {verificationStatus.verified ? <CheckCircleOutlineIcon /> : <WarningAmberIcon />}
                            <span style={{ fontWeight: 700 }}>
                                {verificationStatus.message}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={handleSendVerificationEmail}
                        disabled={emailVerified || sending} 
                        className={`settings-btn ${emailVerified || sending ? '' : 'settings-btn-primary'}`}
                        style={{ maxWidth: '200px', margin: '0 auto' }}
                    >
                        {sending ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <div className="settings-spinner" style={{ height: '1rem', width: '1rem', borderBottomColor: 'white' }}></div>
                                <span>Enviando...</span>
                            </div>
                        ) : (
                            emailVerified ? 'Verificado' : 'Enviar correo'
                        )}
                    </button>
                </div>
            )}

            {/* Custom Snackbar */}
            {(snackbar.open || error) && (
                <div className={`custom-snackbar ${snackbar.severity === 'success' ? 'success' : 'error'} ${error ? 'error' : ''}`}>
                <span>{snackbar.open ? snackbar.message : error}</span>
                <button 
                    onClick={() => {
                        handleCloseSnackbar();
                    }}
                    className="snackbar-close"
                >
                    <CloseIcon fontSize="small" />
                </button>
                </div>
            )}
        </div>
    );
}

export default VerifyEmailComponent;
