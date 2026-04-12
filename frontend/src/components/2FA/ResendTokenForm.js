import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth'; 
import { useHistory, useLocation } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '../../ui/material';
import { ArrowDropDown as ArrowDropDownIcon } from '../../ui/icons';
import { useThemeMode } from '../../ui/styles';

const ResendTokenForm = () => {
    const { resendToken, error, successMessage } = useAuth();
    const history = useHistory();
    const location = useLocation();
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';
    
    const [email, setEmail] = useState(() => location.state?.email || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (successMessage && successMessage.includes('código de verificación')) {
            history.push({ pathname: '/verifytoken', state: { email } });
        }
    }, [successMessage, history, email]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            await resendToken(email);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
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
                            Reenviar Token
                        </Typography>
                    </Box>

                    <Typography style={styles.subtitle}>
                        Ingresa tu correo electrónico para reenviar el código de verificación
                    </Typography>

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Correo electrónico"
                        name="email"
                        type="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        {loading ? <CircularProgress size={24} style={{ color: '#FFFFFF' }} /> : 'Reenviar Código'}
                    </Button>

                    <Box style={{ textAlign: 'center', marginTop: '10px' }}>
                        {error && <Typography color="error" variant="body2">{error}</Typography>}
                        {successMessage && <Typography style={{ color: '#7fffd4' }} variant="body2">{successMessage}</Typography>}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ResendTokenForm;
