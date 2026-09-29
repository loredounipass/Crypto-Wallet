import { useState, use } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import User from '../services/user';
import i18n from '../languages/i18n';
import { fetchCsrfToken } from '../api/http'; // VULN-09/10 FIX: Import fetchCsrfToken




// CUSTOM HOOK THAT ENCAPSULATES AUTHENTICATION LOGIC AND USER SESSION MANAGEMENT
export default function useAuth() {
    const navigate = useNavigate();
    const { setAuth } = use(AuthContext);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);



    // RETRIEVES THE AUTHENTICATED USER INFO FROM THE SERVER AND SETS THE CONTEXT
    const setUserContext = async () => {
        try {
            const { data } = await User.getInfo();
            if (data && 'data' in data) {
                setAuth(data.data);
                navigate('/');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError(err.message);
        }
    };




    // LOGS OUT THE USER, RENEWS THE CSRF TOKEN, AND CLEARS THE AUTHENTICATION CONTEXT
    const logoutUser = async () => {
        try {
            await User.logout();
            await fetchCsrfToken(); // VULN-09/10 FIX: Renew CSRF token after logout
            setAuth(null);
            window.location.reload();
        } catch (err) {
            setError(err.message);
        }
    };




    // REGISTERS A NEW USER ACCOUNT AND REDIRECTS TO THE LOGIN PAGE ON SUCCESS
    const registerUser = async (body) => {
        try {
            const { data } = await User.register(body);
            if (data) {
                navigate('/login');
            } else {
                setError(data?.error || data?.message);
            }
        } catch (err) {
            setError(err.message);
        }
    };




    // AUTHENTICATES THE USER, RENEWS THE CSRF TOKEN, AND REFRESHES THE SESSION STATE
    const loginUser = async (body) => {
        try {
            const { data } = await User.login(body);
            if (data && ('msg' in data || 'message' in data)) {
                if (data.msg === 'Logged in!' || data.message === 'Logged in!') {
                    await fetchCsrfToken(); // VULN-09/10 FIX: Renew CSRF token after login
                    await setUserContext();
                    window.location.reload();
                }
                return data;
            } else {
                setError(data?.error || data?.message);
                return null;
            }
        } catch (err) {
            setError(err.message);
            return null;
        }
    };




    // VERIFIES A 2FA TOKEN DURING LOGIN OR SECURITY ACTIONS
    const verifyToken = async (body) => {
        try {
            const { data } = await User.verifyToken(body);
            if (data && (data.msg === 'Logged in!' || data.message === 'Logged in!')) {
                await fetchCsrfToken(); // VULN-09/10 FIX: Renew CSRF token after 2FA login
                await setUserContext();
                return true;
            } else if (data && (data.msg || data.message)) {
                return data;
            } else {
                const errorMessage = data?.error || data?.message || i18n.t('2fa_error_verify');
                setError(errorMessage);
                return { error: errorMessage };
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message;
            setError(errorMessage);
            return { error: errorMessage };
        }
    };




    // REQUESTS A NEW 2FA TOKEN TO BE SENT TO THE USER'S CONFIGURED DEVICE OR EMAIL
    const resendToken = async (body) => {
        try {
            const { data } = await User.resendToken(body);
            if (data && (data.message || data.msg)) {
                setSuccessMessage(data.message || data.msg);
                return { success: true, message: data.message || data.msg };
            } else {
                setError(data?.error || data?.message);
                return { error: data?.error || data?.message };
            }
        } catch (err) {
            setError(err.message);
            return { error: err.message };
        }
    };




    // UPDATES THE USER'S PASSWORD AND REFRESHES THE USER CONTEXT IF SUCCESSFUL
    const changePassword = async (body) => {
        try {
            const { data } = await User.changePassword(body);
            if (data && (data.message || data.msg)) {
                setSuccessMessage(data.message || data.msg);
                try {
                    const infoResp = await User.getInfo();
                    const user = infoResp?.data?.data;
                    if (user) setAuth(user);
                } catch (err) {
                    // ignore refresh errors
                }
                return { success: true, message: data.message || data.msg };
            } else {
                setError(data?.error || data?.message);
                return { error: data?.error || data?.message };
            }
        } catch (err) {
            setError(err.message);
            return { error: err.message };
        }
    };




    // ENABLES OR DISABLES 2FA SETTINGS FOR THE CURRENT USER
    const updateTokenStatus = async (body) => {
        try {
            const response = await User.updateTokenStatus(body);
            const { data } = response || {};
            if (data && (data.message || data.msg)) {
                setSuccessMessage(data.message || data.msg);
            } else if (data?.error) {
                setError(data.error);
            }
            return data;
        } catch (err) {
            setError(err.message);
            return null;
        }
    };




    // SUBMITS PROFILE CHANGES TO THE SERVER AND REFRESHES THE LOCAL AUTH STATE
    const updateUserProfile = async (body) => {
        try {
            const { data } = await User.updateProfile(body);
            if (data && (data.message || data.msg)) {
                setSuccessMessage(data.message || data.msg);
                try {
                    const infoResp = await User.getInfo();
                    const user = infoResp?.data?.data;
                    if (user) setAuth(user);
                } catch (err) {
                    // ignore refresh errors; UI will still show success
                }
                return { success: true, message: data.message || data.msg };
            } else {
                setError(data?.error || data?.message);
                return { error: data?.error || data?.message };
            }
        } catch (err) {
            setError(err.message);
            return { error: err.message };
        }
    };




    // VERIFIES THE USER'S EMAIL ADDRESS USING A TOKEN SENT VIA EMAIL
    const verifyEmail = async (token) => {
        try {
            const { data } = await User.verifyEmail({ token });
            if (data && (data.message || data.msg)) {
                setSuccessMessage(data.message || data.msg);
                return { success: true, message: data.message || data.msg };
            } else {
                setError(data?.error || data?.message);
                return { error: data?.error || data?.message };
            }
        } catch (err) {
            setError(err.message);
            return { error: err.message };
        }
    };
    
    
    

    // REQUESTS A NEW EMAIL VERIFICATION LINK TO BE SENT TO THE USER'S EMAIL
    const sendVerificationEmail = async () => {
        try {
            const { data } = await User.sendVerificationEmail({});
            if (data && (data.message || data.msg)) {
                setSuccessMessage(data.message || data.msg);
                return { success: true, message: data.message || data.msg };
            } else {
                setError(data?.error || data?.message);
                return { error: data?.error || data?.message };
            }
        } catch (err) {
            setError(err.message);
            return { error: err.message };
        }
    };
    
    
    

    // CHECKS IF THE CURRENT USER'S EMAIL ADDRESS HAS BEEN SUCCESSFULLY VERIFIED
    const isEmailVerified = async () => {
        try {
            const { data } = await User.isEmailVerified(); 
            if (data && data.isVerified) {
                return true; 
            } else {
                return false; 
            }
        } catch (err) {
            setError(err.message);
            return false; 
        }
    };
    

    return {
        registerUser,
        loginUser,
        logoutUser,
        verifyToken,
        resendToken, 
        changePassword,
        updateTokenStatus,
        updateUserProfile,
        verifyEmail,          
        sendVerificationEmail,
        isEmailVerified,
        error,
        successMessage
    };
}
