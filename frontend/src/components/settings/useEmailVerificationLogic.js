import { useState, use } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../hooks/AuthContext';
import useAuth from '../../hooks/useAuth';



// CUSTOM HOOK THAT MANAGES THE ACTUAL EMAIL VERIFICATION ACTION VIA TOKEN
export default function useEmailVerificationLogic() {
    const { auth } = use(AuthContext);
    const { verifyEmail } = useAuth();
    const location = useLocation();
    
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const [showCloseMessage, setShowCloseMessage] = useState(false);



    // EXTRACTS THE TOKEN FROM URL AND TRIGGERS THE VERIFICATION
    const handleVerifyClick = async () => {
        if (auth && auth.email) {
            try {
                const searchParams = new URLSearchParams(location.search);
                const token = searchParams.get('token');
                
                if (!token) {
                    throw new Error('Falta el token de verificación en la URL. Asegúrate de hacer clic en el enlace completo del correo.');
                }
                
                await verifyEmail(token);
                handleVerificationResult({ verified: true, message: 'Correo electrónico verificado con éxito.' });
            } catch (err) {
                handleVerificationResult({ verified: false, message: err.message || 'Error al verificar el correo electrónico.' });
            }
        } else {
            handleVerificationResult({ verified: false, message: 'No se encontró el correo electrónico autenticado.' });
        }
    };



    // PROCESSES AND DISPLAYS THE RESULT OF THE VERIFICATION
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



    // HANDLES CLOSING THE DIALOG AND SHOWING THE SUCCESS/CLOSE MESSAGE
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setShowCloseMessage(true);
    };

    return {
        openDialog,
        dialogMessage,
        showCloseMessage,
        handleVerifyClick,
        handleCloseDialog
    };
}
