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

import Logo from '../Logo';

const ResendTokenForm = () => {
    const { resendToken, error, successMessage } = useAuth();
    const history = useHistory();
    const location = useLocation();
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

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
            await resendToken({ email: email.trim() });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[#F6F8FA] dark:bg-[#0F0F1A] box-border">
            <Box component="form" onSubmit={handleSubmit} noValidate className="w-full max-w-[360px]">
                <Logo />

                <Typography className="text-[#6B7280] dark:text-[#9CA3AF] text-xs mb-6 mt-2 text-center">
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
                    {loading ? <CircularProgress size={24} style={{ color: '#FFFFFF' }} /> : 'Reenviar Código'}
                </Button>

                <Box style={{ textAlign: 'center', marginTop: '10px' }}>
                    {error && <Typography color="error" variant="body2">{error}</Typography>}
                    {successMessage && <Typography style={{ color: '#7fffd4' }} variant="body2">{successMessage}</Typography>}
                </Box>
            </Box>
        </Box>
    );
};

export default ResendTokenForm;
