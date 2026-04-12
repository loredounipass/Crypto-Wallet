import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Alert, Typography, CircularProgress, Button, Snackbar, Box } from '../../ui/material'; 
import { AuthContext } from '../../hooks/AuthContext'; 
import useAuth from '../../hooks/useAuth'; 
import { Alert as MuiAlert } from '../../ui/material';
import { EmailOutlined as EmailOutlinedIcon } from '../../ui/icons';
import { CheckCircleOutline as CheckCircleOutlineIcon } from '../../ui/icons';
import { WarningAmber as WarningAmberIcon } from '../../ui/icons';

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
                setLocalError(error.message || 'Error al enviar el correo de verificación.');
                setSnackbar({ open: true, message: localError, severity: "error" });
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
        <>
            <Typography 
                variant="h4" 
                gutterBottom 
                sx={{ 
                    fontWeight: 700,
                    color: '#0E1BCE', 
                    textAlign: 'center', 
                    padding: 2,
                    fontSize: { xs: '1.4rem', sm: '1.9rem' } 
                }}
            >
                Verificar correo electrónico
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <EmailOutlinedIcon sx={{ color: '#6b7280' }} />
                <Typography 
                    variant="body1" 
                    gutterBottom 
                    sx={{ 
                        color: '#4b5563', 
                        textAlign: 'center', 
                        maxWidth: '520px', 
                        margin: '0 auto', 
                        fontSize: { xs: '0.9rem', sm: '1rem' } 
                    }}
                >
                    Correo autenticado: <Box component="span" sx={{ fontWeight: 700, color: '#111827' }}>{auth?.email || 'Correo no disponible'}</Box>
                </Typography>
            </Box>

            {loading ? (
                <CircularProgress sx={{ display: 'block', margin: '20px auto', color: '#1976d2' }} />
            ) : (
                <>
                    {localError && (
                        <Alert 
                            severity="error" 
                            variant="filled"
                            sx={{ 
                                mt: 3, 
                                borderRadius: '8px', 
                                color: '#fff', 
                                fontWeight: 600, 
                                textAlign: 'center', 
                                maxWidth: '520px', 
                                margin: '0 auto',
                                px: 2
                            }}
                        >
                            {localError}
                        </Alert>
                    )}

                    {verificationStatus && (
                        <Alert 
                            severity={verificationStatus.verified ? 'success' : 'warning'} 
                            variant="outlined"
                            icon={verificationStatus.verified ? <CheckCircleOutlineIcon /> : <WarningAmberIcon />}
                            sx={{ 
                                mt: 3, 
                                borderRadius: '10px', 
                                textAlign: 'center', 
                                maxWidth: '520px', 
                                margin: '0 auto',
                                px: 2,
                                py: 1.2,
                                bgcolor: verificationStatus.verified ? 'rgba(16,185,129,0.06)' : 'rgba(255,152,0,0.06)'
                            }}
                        >
                            <Typography component="span" sx={{ fontWeight: 700, color: verificationStatus.verified ? '#065f46' : '#7c2d00' }}>
                                {verificationStatus.message}
                            </Typography>
                        </Alert>
                    )}

                    <Button
                        variant="contained"
                        onClick={handleSendVerificationEmail}
                        disabled={emailVerified || sending} 
                        sx={{ 
                            display: 'block', 
                            margin: '20px auto', 
                            padding: '10px 20px', 
                            fontSize: { xs: '14px', sm: '16px' }, 
                            borderRadius: '12px', 
                            maxWidth: '220px',
                            background: 'linear-gradient(90deg,#115AF7,#0E1BCE)',
                            boxShadow: '0 8px 24px rgba(14,27,206,0.12)',
                            '&:hover': { filter: 'brightness(0.97)' }
                        }}
                    >
                        {sending ? <CircularProgress size={22} color="inherit" /> : (emailVerified ? 'Verificado' : 'Enviar correo')}
                    </Button>
                </>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
                <MuiAlert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </MuiAlert>
            </Snackbar>

            {error && (
                <Alert 
                    severity="error" 
                    variant="filled"
                    sx={{ 
                        mb: 2, 
                        borderRadius: '8px', 
                        color: '#fff', 
                        fontWeight: 'bold', 
                        textAlign: 'center', 
                        maxWidth: '520px', 
                        margin: '0 auto',
                        px: 2
                    }}
                >
                    {error}
                </Alert>
            )}
        </>
    );
};

export default VerifyEmailComponent;
