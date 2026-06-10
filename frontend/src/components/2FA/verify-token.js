import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Link,
} from '../../ui/material';
import Logo from '../Logo';
import TransactionToast from '../TransactionToast';

const VerifyToken = () => {
    const [formValues, setFormValues] = useState({ token: '' });
    const { verifyToken, error: authError } = useAuth();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const history = useHistory();
    const location = useLocation();

    // Keep email in navigation state only; avoid persisting PII in localStorage
    const email = location.state?.email;

    // Track mounted state to prevent state updates after unmount
    const isMounted = React.useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const handleChange = (e) => {
        setFormValues({ ...formValues, [e.target.name]: e.target.value });
        setToast(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!email) {
            setToast({ kind: 'error', message: 'No se encontró el correo electrónico. Por favor, inicia sesión nuevamente.' });
            return;
        }

        if (!formValues.token || formValues.token.trim().length === 0) {
            setToast({ kind: 'error', message: 'Por favor, ingresa el código de verificación.' });
            return;
        }

        if (formValues.token.length < 6) {
            setToast({ kind: 'error', message: 'El código debe tener al menos 6 dígitos.' });
            return;
        }

        setLoading(true);
        setToast(null);

        try {
            const result = await verifyToken({ email, token: formValues.token });
            
            if (!isMounted.current) return;

            // verifyToken returns true on success (and handles navigation)
            // It returns false on failure, or an object with an error message
            if (result === true) {
                setToast({ kind: 'success', message: '¡Verificación exitosa! Redirigiendo...' });
            } else if (result && (result.msg || result.message)) {
                setToast({ kind: 'success', message: result.message || result.msg });
            } else if (result && result.error) {
                setToast({ kind: 'error', message: result.error });
            } else if (result === false) {
                setToast({ kind: 'error', message: authError || 'Error al verificar el token' });
            }
        } catch (err) {
            if (isMounted.current) {
                setToast({ kind: 'error', message: err.message });
            }
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    const handleResend = () => {
        history.push({ pathname: '/resendtoken', state: { email } });
    };

    return (
        <Box className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[#F6F8FA] dark:bg-[#0F0F1A] box-border">
            <Box component="form" onSubmit={handleSubmit} noValidate className="w-full max-w-[360px]">
                <Logo />

                <Typography className="text-[#6B7280] dark:text-[#9CA3AF] text-xs mb-2 mt-2 text-center">
                    Verificación
                </Typography>

                <Typography className="text-[#6B7280] dark:text-[#9CA3AF] text-xs mb-6 text-center">
                    Por favor, ingresa el token que recibiste en el correo electrónico
                </Typography>

                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="token"
                    label="Token"
                    name="token"
                    autoFocus
                    value={formValues.token}
                    onChange={handleChange}
                    InputProps={{
                      sx: {
                        borderRadius: 12,
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        backgroundColor: 'rgba(15, 15, 26, 0.8)',
                        color: '#FFFFFF',
                        backdropFilter: 'blur(10px)',
                      },
                    }}
                    InputLabelProps={{
                      shrink: true,
                      style: { color: '#A5B4FC' },
                    }}
                    sx={{
                      '& label': { color: '#A5B4FC' },
                      '& label.Mui-focused': { color: '#818CF8' },
                    }}
                />

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    className="!mt-6 !mb-4 !text-white !font-semibold"
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontSize: '16px',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #2186EB 100%)',
                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                    }}
                >
                    {loading ? (
                        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                            <CircularProgress size={20} style={{ color: '#FFFFFF' }} />
                            <Typography style={{ marginLeft: '10px', color: '#FFFFFF', fontSize: '16px', fontWeight: 600 }}>
                                Verificando...
                            </Typography>
                        </Box>
                    ) : (
                        'Verificar'
                    )}
                </Button>

                <Box className="text-center mt-6">
                  <Link onClick={handleResend} className="text-sm font-bold no-underline cursor-pointer" style={{ color: '#6366F1' }}>
                    Reenviar Token
                  </Link>
                </Box>
            </Box>
            
            <TransactionToast toast={toast} onClose={() => setToast(null)} />
        </Box>
    );
};

export default VerifyToken;
