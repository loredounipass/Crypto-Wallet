import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../../hooks/AuthContext'; 
import useAuth from '../../hooks/useAuth'; 
import {
    EmailOutlined as EmailOutlinedIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    WarningAmber as WarningAmberIcon,
    Close as CloseIcon,
} from '../../ui/icons';

import './Settings.css';


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
        <div className="flex w-full flex-col border-0 bg-transparent p-0 shadow-none">
            <div className="mb-6 flex items-center gap-4 border-b pb-4" style={{ borderColor: 'var(--settings-border)' }}>
                <div className="flex items-center justify-center rounded-xl bg-[rgba(33,134,235,0.1)] p-3">
                    <EmailOutlinedIcon className="text-[28px]" style={{ color: 'var(--settings-primary)' }} />
                </div>
                <h2 className="m-0 text-[20px] font-semibold" style={{ color: 'var(--settings-text)' }}>Verificar correo electrónico</h2>
            </div>

            <div className="mb-6 flex items-center gap-3 rounded-xl border p-4" style={{ borderColor: 'var(--settings-border)', backgroundColor: 'var(--settings-bg)' }}>
                <EmailOutlinedIcon style={{ color: 'var(--settings-muted)' }} />
                <p style={{ color: 'var(--settings-muted)', margin: 0 }}>
                    Correo autenticado: <span style={{ fontWeight: 700, color: 'var(--settings-text)' }}>{auth?.email || 'Correo no disponible'}</span>
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center p-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-[rgba(33,134,235,0.3)] border-t-[#2186EB]"></div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {localError && (
                        <div className="mt-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ 
                          border: '1px solid rgba(239,68,68,0.2)', 
                          backgroundColor: 'rgba(239,68,68,0.1)', 
                          color: 'var(--settings-danger)' 
                        }}>
                            {localError}
                        </div>
                    )}

                    {verificationStatus && (
                        <div className={`flex items-center gap-3 rounded-xl border px-4 py-4 font-medium ${verificationStatus.verified 
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
                        className="box-border w-full cursor-pointer rounded-xl border-0 px-6 py-[14px] text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ 
                          maxWidth: '200px', 
                          margin: '0 auto',
                          backgroundColor: (emailVerified || sending) ? 'var(--settings-muted)' : 'var(--settings-primary)'
                        }}
                        onMouseEnter={(e) => {
                          if (!emailVerified && !sending) e.target.style.backgroundColor = 'var(--settings-primary-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = (emailVerified || sending) ? 'var(--settings-muted)' : 'var(--settings-primary)';
                        }}
                    >
                        {sending ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <div className="h-4 w-4 animate-spin rounded-full border-[2px] border-[rgba(255,255,255,0.3)] border-b-white"></div>
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
                <div className="fixed bottom-6 left-1/2 z-[1001] flex -translate-x-1/2 items-center gap-4 rounded-xl border px-5 py-3 text-sm font-medium shadow-[0_4px_12px_rgba(0,0,0,0.15)]" style={{ 
                  backgroundColor: 'var(--settings-card)', 
                  color: 'var(--settings-text)', 
                  borderColor: 'var(--settings-border)',
                  borderLeft: `4px solid ${(snackbar.severity === 'success' && !error) ? 'var(--settings-success)' : 'var(--settings-danger)'}`
                }}>
                    <span>{snackbar.open ? snackbar.message : error}</span>
                    <button 
                        onClick={() => {
                            handleCloseSnackbar();
                        }}
                        className="flex items-center justify-center rounded-full border-0 p-1"
                        style={{ color: 'var(--settings-muted)', backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--settings-bg)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        <CloseIcon fontSize="small" />
                    </button>
                </div>
            )}
        </div>
    );
}

export default VerifyEmailComponent;
