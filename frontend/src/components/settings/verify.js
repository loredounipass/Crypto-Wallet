import React, { useContext, useState } from 'react';
import { AuthContext } from '../../hooks/AuthContext';
import useAuth from '../../hooks/useAuth';

const EmailVerificationComponent = () => {
    const { auth } = useContext(AuthContext);
    const { verifyEmail } = useAuth();
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const [showCloseMessage, setShowCloseMessage] = useState(false);

    const handleVerifyClick = async () => {
        if (auth && auth.email) {
            try {
                // No need to pass email - it comes from authenticated session
                await verifyEmail();
                handleVerificationResult({ verified: true, message: 'Correo electrónico verificado con éxito.' });
            } catch (err) {
                handleVerificationResult({ verified: false, message: err.message || 'Error al verificar el correo electrónico.' });
            }
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
        <div className="settings-full-page">
            <div className="settings-section-wrapper">
                {!showCloseMessage ? (
                    <>
                        <h1 className="settings-title-large">
                            Verificar correo electrónico
                        </h1>
                        <p className="settings-text-secondary" style={{ fontSize: '1.125rem' }}>
                            Haz clic en el botón para validar tu dirección de correo asociada a la cuenta.
                        </p>

                        <button
                            onClick={handleVerifyClick}
                            className="settings-btn settings-btn-primary"
                            style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
                        >
                            Validar correo electrónico
                        </button>

                        {/* Custom Modal */}
                        {openDialog && (
                            <div className="modal-overlay">
                                <div className="modal-content">
                                    <h3 className="modal-title">Estado de verificación</h3>
                                    <p className="modal-text">
                                        {dialogMessage}
                                    </p>
                                    <div className="modal-actions">
                                        <button
                                            onClick={handleCloseDialog}
                                            className="btn-secondary"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="settings-text-secondary" style={{ fontSize: '1.125rem', marginTop: '1rem' }}>
                        Puedes cerrar esta ventana.
                    </p>
                )}
            </div>
        </div>
    );
};

export default EmailVerificationComponent;
