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
import { ArrowDropDown as ArrowDropDownIcon } from '../../ui/icons';
import { useThemeMode } from '../../ui/styles';

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
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';

    // Get email from route state first, fall back to localStorage (set during login)
    const email = location.state?.email || localStorage.getItem('email');

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

    const styles = {
        page: {
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: isMobile ? '16px' : '24px',
            backgroundColor: isDark ? '#0F0F1A' : '#F6F8FA',
            boxSizing: 'border-box',
        },
        card: {
            width: '100%',
            maxWidth: '460px',
            padding: isMobile ? '4px' : '8px',
        },
        title: {
            color: isDark ? '#FFFFFF' : '#111827',
            fontWeight: 700,
            fontSize: isMobile ? '22px' : '26px',
            marginBottom: '2px',
        },
        subtitle: {
            color: isDark ? '#9CA3AF' : '#6B7280',
            fontSize: '13px',
            marginBottom: isMobile ? '14px' : '18px',
            textAlign: 'center',
        },
        input: {
            borderRadius: 12,
            border: `1px solid ${isDark ? '#2D2D44' : '#E5E7EB'}`,
            backgroundColor: isDark ? '#0F0F1A' : '#FFFFFF',
            color: isDark ? '#FFFFFF' : '#111827',
        },
        link: {
            marginTop: '8px',
            fontSize: '0.9rem',
            color: '#2186EB',
            fontWeight: 600,
            textDecoration: 'none',
            cursor: 'pointer',
        },
    };

    return (
        <Box style={styles.page}>
            <Box style={styles.card}>
                <Box component="form" onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
                    <Box
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            marginBottom: '6px',
                        }}
                    >
                        <Box
                            style={{
                                width: 45,
                                height: 50,
                                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                                backgroundColor: '#2186EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <ArrowDropDownIcon style={{ color: 'white', fontSize: 40 }} />
                        </Box>
                        <Typography component="h1" style={styles.title}>
                            Verificación
                        </Typography>
                    </Box>

                    <Typography style={styles.subtitle}>
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
                        InputProps={{ sx: styles.input }}
                        InputLabelProps={{ shrink: true }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        style={{
                            marginTop: '16px',
                            marginBottom: '10px',
                            color: 'white',
                            backgroundColor: '#2186EB',
                            borderRadius: '12px',
                            padding: isMobile ? '12px 14px' : '14px 16px',
                            fontWeight: 600,
                        }}
                    >
                        {loading ? <CircularProgress size={24} style={{ color: '#FFFFFF' }} /> : 'Verificar'}
                    </Button>

                    <Box style={{ textAlign: 'center', marginTop: '10px' }}>
                        <Link onClick={handleResend} style={styles.link}>
                            Reenviar Token
                        </Link>
                    </Box>

                    <Box style={{ textAlign: 'center', marginTop: '10px' }}>
                        {error && <Typography color="error" variant="body2">{error}</Typography>}
                        {success && <Typography style={{ color: '#7fffd4' }} variant="body2">{success}</Typography>}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default VerifyToken;
