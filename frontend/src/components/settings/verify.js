import React, { useContext, useState } from 'react';
import { AuthContext } from '../../hooks/AuthContext';
import User from '../../services/user';
import { Button, Typography, Dialog, DialogTitle, DialogContent, Box } from '@mui/material';

const EmailVerificationComponent = () => {
    const { auth } = useContext(AuthContext);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const [showCloseMessage, setShowCloseMessage] = useState(false);

    const verifyEmail = async (email) => {
        try {
            const { data } = await User.verifyEmail({ email });
            if (data && data.message === 'Correo electrónico verificado con éxito.') {
                handleVerificationResult({ verified: true, message: `✔️ ${data.message}` });
            } else {
                handleVerificationResult({ verified: false, message: data.error || 'Error al verificar el correo electrónico.' });
            }
        } catch (err) {
            handleVerificationResult({ verified: false, message: err.message });
        }
    };

    const handleVerifyClick = () => {
        if (auth && auth.email) {
            verifyEmail(auth.email);
        } else {
            handleVerificationResult({ verified: false, message: 'No se encontró el correo electrónico autenticado.' });
        }
    };

    const handleVerificationResult = (result) => {
        setDialogMessage(result.message);
        setOpenDialog(true);
        setShowCloseMessage(false); 

        if (result.verified) {
            setTimeout(() => {
                setOpenDialog(false);
                setShowCloseMessage(true); 
            }, 5000); 
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setShowCloseMessage(true);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                bgcolor: '#f6f8fa', 
                padding: 3,
                textAlign: 'center',
            }}
        >
            <Box sx={{ maxWidth: 480, width: '100%' }}>
                    {!showCloseMessage ? (
                        <>
                            <Typography variant="h4" gutterBottom sx={{ fontSize: '1.8rem', fontWeight: 700, color: '#0E1BCE' }}>
                                Verificar correo electrónico
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#555', mb: 2 }}>
                                Haz clic en el botón para validar tu dirección de correo asociada a la cuenta.
                            </Typography>

                            <Button
                                variant="contained"
                                onClick={handleVerifyClick}
                                sx={{ mt: 2, fontSize: '1rem', padding: '10px 18px', background: 'linear-gradient(90deg,#115AF7,#0E1BCE)', boxShadow: '0 6px 18px rgba(14,27,206,0.12)', '&:hover': { filter: 'brightness(0.95)' } }}
                            >
                                Validar correo electrónico
                            </Button>

                            <Dialog
                                open={openDialog}
                                onClose={handleCloseDialog}
                                PaperProps={{
                                    sx: {
                                        padding: 3,
                                        textAlign: 'center',
                                        borderRadius: 2,
                                        minWidth: 300,
                                    },
                                }}
                            >
                                <DialogTitle sx={{ fontWeight: 700 }}>Estado de verificación</DialogTitle>
                                <DialogContent
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Typography variant="body1" sx={{ mt: 2, color: '#333' }}>
                                        {dialogMessage}
                                    </Typography>
                                </DialogContent>
                            </Dialog>
                        </>
                    ) : (
                        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', fontSize: '1.05rem' }}>
                            Puedes cerrar esta ventana.
                        </Typography>
                    )}
                </Box>
        </Box>
    );
};

export default EmailVerificationComponent;
