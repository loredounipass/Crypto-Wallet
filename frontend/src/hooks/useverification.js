import { useState } from 'react';
import { verifyToken } from '../services/userverification';




// CUSTOM HOOK THAT MANAGES THE STATE AND VERIFICATION LOGIC FOR 2FA TOKENS
export const useTwoFactorAuth = () => {
    const [isTokenValid, setIsTokenValid] = useState(null);
    const [message, setMessage] = useState('');




    // SENDS THE TOKEN TO THE BACKEND FOR VERIFICATION AND UPDATES THE LOCAL STATE
    const handleVerifyToken = async (token) => {
        try {
            const response = await verifyToken(token);
            const isValid = response.data.message === 'Código válido';
            setIsTokenValid(isValid);
            setMessage(isValid ? 'Token verified successfully' : 'Invalid token');
            return isValid; // Asegúrate de devolver el valor booleano
        } catch (error) {
            console.error('Error verifying token:', error);
            setIsTokenValid(false);
            setMessage('Invalid token');
            return false; // Devuelve false en caso de error
        }
    };

    return {
        isTokenValid,
        message,
        handleVerifyToken
    };
};
