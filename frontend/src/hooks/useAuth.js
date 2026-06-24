import { useState, use } from 'react';
import { useHistory } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import User from '../services/user';

export default function useAuth() {
    let history = useHistory();
    const { setAuth } = use(AuthContext);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const setUserContext = async () => {
        try {
            const { data } = await User.getInfo();
            if (data && 'data' in data) {
                setAuth(data.data);
                history.push('/');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const logoutUser = async () => {
        try {
            await User.logout();
            setAuth(null);
            history.push('/login');
        } catch (err) {
            setError(err.message);
        }
    };

    const registerUser = async (body) => {
        try {
            const { data } = await User.register(body);
            if (data) {
                history.push('/login');
            } else {
                setError(data?.error || data?.message);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const loginUser = async (body) => {
        try {
            const { data } = await User.login(body);
            if (data && ('msg' in data || 'message' in data)) {
                if (data.msg === 'Logged in!' || data.message === 'Logged in!') {
                    await setUserContext();
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

    const verifyToken = async (body) => {
        try {
            const { data } = await User.verifyToken(body);
            if (data && (data.msg === 'Logged in!' || data.message === 'Logged in!')) {
                await setUserContext();
                return true;
            } else if (data && (data.msg || data.message)) {
                return data;
            } else {
                const errorMessage = data?.error || data?.message || 'Error en la verificación';
                setError(errorMessage);
                return { error: errorMessage };
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message;
            setError(errorMessage);
            return { error: errorMessage };
        }
    };

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
