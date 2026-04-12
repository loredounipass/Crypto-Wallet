import React, { useContext, useState, useEffect } from 'react';
import { Alert, Typography, CircularProgress, Container } from '../../ui/material';
import { AuthContext } from '../../hooks/AuthContext'; 
import useAuth from '../../hooks/useAuth'; 

const EmailVerificationStatus = () => {
    const { auth } = useContext(AuthContext); 
    const { isEmailVerified } = useAuth(); 

    const [verificationStatus, setVerificationStatus] = useState(null);
    const [loading, setLoading] = useState(true); 
    const [localError, setLocalError] = useState(null);

    useEffect(() => {
        const checkEmailVerification = async () => {
            setLocalError(null); 
            try {
                const isVerified = await isEmailVerified(); 

                if (isVerified) {
                    setVerificationStatus({
                        verified: true,
                        message: 'Correo electrónico verificado con éxito.',
                    });
                } else {
                    setVerificationStatus({
                        verified: false,
                        message: 'El correo electrónico no está verificado.',
                    });
                }
            } catch (err) {
                setLocalError(err.message || 'Error al verificar el correo.');
                setVerificationStatus(null); 
            } finally {
                setLoading(false); 
            }
        };

        if (auth && auth.email) {
            checkEmailVerification(); 
        } else {
            setLocalError('No se ha encontrado un correo electrónico autenticado.');
            setLoading(false); 
        }
    }, [auth, isEmailVerified]); 

    return (
        <Container maxWidth="sm" sx={{ textAlign: 'center', paddingTop: 5 }}>
            <Typography variant="h5" gutterBottom>
                Verificar Estado del Correo Electrónico
            </Typography>
            <Typography variant="body1" gutterBottom>
                Correo electrónico autenticado: <strong>{auth?.email || 'Correo no disponible'}</strong>
            </Typography>
            {loading ? (
                <CircularProgress sx={{ mt: 3 }} />
            ) : (
                <>
                    {localError && (
                        <Alert severity="error" sx={{ mt: 3 }}>
                            {localError}
                        </Alert>
                    )}
                    {verificationStatus && (
                        <Alert severity={verificationStatus.verified ? 'success' : 'warning'} sx={{ mt: 3 }}>
                            {verificationStatus.message}
                        </Alert>
                    )}
                </>
            )}
        </Container>
    );
};

export default EmailVerificationStatus;
