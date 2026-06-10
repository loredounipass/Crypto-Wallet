import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../hooks/AuthContext'; 
import useAuth from '../../hooks/useAuth'; 
import TransactionToast from '../TransactionToast';
import {
    EmailOutlined as EmailOutlinedIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    WarningAmber as WarningAmberIcon,
} from '../../ui/icons';

import './Settings.css';


const VerifyEmailComponent = () => {
    const { auth } = useContext(AuthContext); 
    const { sendVerificationEmail, isEmailVerified, error, successMessage } = useAuth();
    
    

    const [verificationStatus, setVerificationStatus] = useState(null);
    const [loading, setLoading] = useState(true); 
    const [emailVerified, setEmailVerified] = useState(false);
    const [hasCheckedVerification, setHasCheckedVerification] = useState(false); 
    const [sending, setSending] = useState(false); 
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const checkEmailVerification = async () => {
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
            setLoading(false); 
            setHasCheckedVerification(true); 
        };

        if (auth && auth.email && !hasCheckedVerification) {
            checkEmailVerification(); 
        } else if (!auth || !auth.email) {
            setToast({ kind: 'error', message: 'No se ha encontrado un correo electrónico autenticado.' });
            setLoading(false); 
        }
    }, [auth, isEmailVerified, hasCheckedVerification]); 

    const handleSendVerificationEmail = async () => {
        if (auth && auth.email) {
            setSending(true); 
            await sendVerificationEmail();
            setSending(false); 
        }
    };

    useEffect(() => {
        if (successMessage) {
            setToast({ kind: 'success', message: successMessage });
        }
    }, [successMessage]);

    useEffect(() => {
        if (error) {
            setToast({ kind: 'error', message: error });
        }
    }, [error]);

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

            <TransactionToast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
}

export default VerifyEmailComponent;
