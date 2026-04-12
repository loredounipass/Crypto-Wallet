import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, Grid, Alert } from '../../ui/material';
import { ArrowDropDown as ArrowDropDownIcon } from '../../ui/icons';
import useAuth from '../../hooks/useAuth'; 
import { useHistory } from 'react-router-dom';

const ResendTokenForm = () => {
    const { resendToken, error, successMessage } = useAuth();
    const [email, setEmail] = useState('');
    const history = useHistory();

    useEffect(() => {
        if (successMessage === 'Código de verificación reenviado a tu correo electrónico.') {
            history.push('/verifytoken');
        }
    }, [successMessage, history]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            await resendToken({ email });
        } catch (err) {
            console.error(err);
        }
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
                        Ingresa tu correo electrónico para reenviar el código de verificación
                    </Typography>

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Correo electrónico"
                        name="email"
                        autoFocus
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        InputProps={{ sx: { borderRadius: 2, border: '1px solid #ddd' } }}
                        InputLabelProps={{ shrink: true }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, color: 'white', bgcolor: '#326DEB', '&:hover': { bgcolor: '#326DEB' } }}
                    >
                        Reenviar Código
                    </Button>

                    <Grid container direction="column" alignItems="center">
                        {error && (
                            <Grid item>
                                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                            </Grid>
                        )}
                        {successMessage && (
                            <Grid item>
                                <Alert severity="success" sx={{ mt: 2 }}>{successMessage}</Alert>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </Box>
        </Box>
    );
};

export default ResendTokenForm;
