import React from 'react';
import useEmailVerificationLogic from './useEmailVerificationLogic';

const EmailVerificationComponent = () => {
    const {
        openDialog,
        dialogMessage,
        showCloseMessage,
        handleVerifyClick,
        handleCloseDialog
    } = useEmailVerificationLogic();

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
