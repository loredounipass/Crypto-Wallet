import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../../hooks/AuthContext'; 
import useAuth from '../../hooks/useAuth'; 
import {
    EmailOutlined as EmailOutlinedIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    WarningAmber as WarningAmberIcon,
    Close as CloseIcon,
} from '../../ui/icons';
import { useThemeMode } from '../../ui/styles';

const VerifyEmailComponent = () => {
    const { auth } = useContext(AuthContext); 
    const { sendVerificationEmail, isEmailVerified, error } = useAuth(); 
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';

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
            <div className={`mb-6 flex items-center gap-4 border-b pb-4 ${isDark ? 'border-[#2D2D44]' : 'border-[#E5E7EB]'}`}>
                <div className="flex items-center justify-center rounded-xl bg-[rgba(33,134,235,0.1)] p-3">
                    <EmailOutlinedIcon className="text-[28px] text-[#2186EB]" />
                </div>
                <h2 className={`m-0 text-[20px] font-semibold ${isDark ? 'text-white' : 'text-[#111827]'}`}>Verificar correo electrónico</h2>
            </div>

            <div className={`mb-6 flex items-center gap-3 rounded-xl border p-4 ${isDark ? 'border-[#2D2D44] bg-[#0F0F1A]' : 'border-[#E5E7EB] bg-[#F6F8FA]'}`}>
                <EmailOutlinedIcon style={{ color: isDark ? '#9CA3AF' : '#6B7280' }} />
                <p className={`m-0 ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
                    Correo autenticado: <span className={`font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>{auth?.email || 'Correo no disponible'}</span>
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center p-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-[rgba(33,134,235,0.3)] border-t-[#2186EB]"></div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {localError && (
                        <div className="mt-4 rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm font-medium text-[#ef4444]">
                            {localError}
                        </div>
                    )}

                    {verificationStatus && (
                        <div className={`flex items-center gap-3 rounded-xl border px-4 py-4 font-medium ${verificationStatus.verified 
                                ? 'border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.1)] text-[#22c55e]' 
                                : 'border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.1)] text-[#f59e0b]'}`}>
                            {verificationStatus.verified ? <CheckCircleOutlineIcon /> : <WarningAmberIcon />}
                            <span style={{ fontWeight: 700 }}>
                                {verificationStatus.message}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={handleSendVerificationEmail}
                        disabled={emailVerified || sending} 
                        className={`box-border w-full max-w-[200px] cursor-pointer rounded-xl border-0 px-6 py-[14px] text-sm font-semibold text-white transition-all ${emailVerified || sending ? 'cursor-not-allowed bg-[#9CA3AF] opacity-60' : 'bg-[#2186EB] hover:bg-[#1A6BC7]'}`}
                        style={{ maxWidth: '200px', margin: '0 auto' }}
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
                <div className={`fixed bottom-6 left-1/2 z-[1001] flex -translate-x-1/2 items-center gap-4 rounded-xl border px-5 py-3 text-sm font-medium shadow-[0_4px_12px_rgba(0,0,0,0.15)] ${isDark ? 'bg-[#1A1A2E] text-white border-[#2D2D44]' : 'bg-white text-[#111827] border-[#E5E7EB]'} ${(snackbar.severity === 'success' && !error) ? 'border-l-4 border-l-[#22c55e]' : 'border-l-4 border-l-[#ef4444]'}`}>
                <span>{snackbar.open ? snackbar.message : error}</span>
                <button 
                    onClick={() => {
                        handleCloseSnackbar();
                    }}
                    className={`flex items-center justify-center rounded-full border-0 p-1 ${isDark ? 'text-[#9CA3AF] hover:bg-[#0F0F1A]' : 'text-[#6B7280] hover:bg-[#F6F8FA]'}`}
                >
                    <CloseIcon fontSize="small" />
                </button>
                </div>
            )}
        </div>
    );
}

export default VerifyEmailComponent;
