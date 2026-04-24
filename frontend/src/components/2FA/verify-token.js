import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Link,
} from '../../ui/material';
import Logo from '../Logo';

const VerifyToken = () => {
    const [formValues, setFormValues] = useState({ token: '' });
    const { verifyToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const history = useHistory();
    const location = useLocation();
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

    // Keep email in navigation state only; avoid persisting PII in localStorage
    const email = location.state?.email;

    // Track mounted state to prevent state updates after unmount
    const isMounted = React.useRef(true);
    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    const handleChange = (e) => {
        setFormValues({ ...formValues, [e.target.name]: e.target.value });
        if (error) setError(null);
        if (success) setSuccess(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!email) {
            setError('No se encontró el correo electrónico. Por favor, inicia sesión nuevamente.');
            return;
        }

        if (!formValues.token || formValues.token.trim().length === 0) {
            setError('Por favor, ingresa el código de verificación.');
            return;
        }

        if (formValues.token.length < 6) {
            setError('El código debe tener al menos 6 dígitos.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await verifyToken({ email, token: formValues.token });
            
            if (!isMounted.current) return;

            // verifyToken returns undefined on success (setUserContext handles navigation)
            // It returns data if 2FA code was resent, or sets error internally
            if (result === undefined) {
                // Success case - setUserContext already navigated to '/'
                setSuccess('¡Verificación exitosa! Redirigiendo...');
            } else if (result?.error) {
                setError(result.error);
            }
        } catch (err) {
            if (isMounted.current) {
                setError('Error de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.');
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
                        padding: isMobile ? '12px 14px' : '14px 16px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #2186EB 100%)',
                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                    }}
                >
                    {loading ? <CircularProgress size={24} style={{ color: '#FFFFFF' }} /> : 'Verificar'}
                </Button>

                <Box className="text-center mt-6">
                  <Link onClick={handleResend} className="text-sm font-bold no-underline cursor-pointer" style={{ color: '#6366F1' }}>
                    Reenviar Token
                  </Link>
                </Box>

                <Box style={{ textAlign: 'center', marginTop: '10px' }}>
                    {error && <Typography color="error" variant="body2">{error}</Typography>}
                    {success && <Typography style={{ color: '#7fffd4' }} variant="body2">{success}</Typography>}
                </Box>
            </Box>
        </Box>
    );
};

export default VerifyToken;
