import React, { useState, useRef, useEffect } from 'react';
import { Typography, Box, Button, TextField, Grid, Alert, CircularProgress } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useHistory } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const VerifyToken = () => {
    const [formValues, setFormValues] = useState({ token: '' });
    const { verifyToken, error } = useAuth();
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null); 
    const history = useHistory();
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleChange = (e) => {
        setFormValues({ ...formValues, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const storedEmail = localStorage.getItem('email');
        if (!storedEmail) {
            setLocalError('No se encontró el correo electrónico. Por favor, asegúrate de que estés autenticado.'); // Mensaje de error si no se encuentra el correo
            return;
        }

        setLoading(true);
        setTimeout(async () => {
            try {
                const response = await verifyToken({ email: storedEmail, ...formValues });
                if (isMounted.current && response?.msg === 'Logged in!') {
                    history.push('/');
                }
            } catch (err) {
            } finally {
                if (isMounted.current) setLoading(false);
            }
        }, 2000);
    };

    const handleResend = () => {
        history.push('/resendtoken');
    };

    return (
        <Box
            sx={{
                minHeight: 'calc(100vh - 140px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%'
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: '480px',
                    mt: 0,
                    px: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%', mt: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                        <Box sx={{ width: 45, height: 50, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', bgcolor: '#2186EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowDropDownIcon sx={{ color: 'white', fontSize: 40 }} />
                        </Box>

                        <Typography component="h1" variant="h5" sx={{ fontWeight: 502 }}>
                            BlockVault
                        </Typography>
                    </Box>

                    <Typography variant="body1" align="center" sx={{ mb: 2 }}>
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
                        InputProps={{ sx: { borderRadius: 2, border: '1px solid #ddd' } }}
                        InputLabelProps={{ shrink: true }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, color: 'white', bgcolor: '#326DEB', '&:hover': { bgcolor: '#326DEB' } }}
                        disabled={loading}
                    >
                        {loading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CircularProgress size={20} sx={{ color: '#074EE7FF' }} />
                                <Typography sx={{ ml: 1, color: '#074EE7FF', fontSize: '0.875rem' }}>Verificando...</Typography>
                            </Box>
                        ) : (
                            'Verificar'
                        )}
                    </Button>

                    <Grid container direction="column" alignItems="center">
                        <Grid item>
                            <Box onClick={handleResend} sx={{ mt: 2, fontSize: '0.875rem', color: '#326DEB', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                Reenviar Token
                            </Box>
                        </Grid>
                    </Grid>

                    {localError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {localError}
                        </Alert>
                    )}
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default VerifyToken;
