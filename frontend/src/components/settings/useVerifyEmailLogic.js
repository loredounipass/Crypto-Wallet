import { use, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../hooks/AuthContext'; 
import useAuth from '../../hooks/useAuth'; 



// CUSTOM HOOK THAT MANAGES EMAIL VERIFICATION STATUS AND RESENDING VERIFICATION EMAILS
export default function useVerifyEmailLogic() {
    const { t } = useTranslation();
    const { auth } = use(AuthContext); 
    const { sendVerificationEmail, isEmailVerified } = useAuth();
    
    const [ui, setUi] = useState({
        verificationStatus: null,
        loading: true,
        emailVerified: false,
        sending: false
    });
    const hasCheckedVerification = useRef(false);
    const [toast, setToast] = useState(null);



    // EFFECT TO CHECK IF THE USER'S EMAIL IS ALREADY VERIFIED
    useEffect(() => {
        const checkEmailVerification = async () => {
            const isVerified = await isEmailVerified(); 
            setUi(prev => ({
                ...prev,
                verificationStatus: {
                    verified: isVerified,
                    message: isVerified ? t('email_verified_message') : t('email_not_verified_message')
                },
                emailVerified: isVerified,
                loading: false
            }));
            hasCheckedVerification.current = true;
        };

        if (auth && auth.email && !hasCheckedVerification.current) {
            checkEmailVerification(); 
        } else if (!auth || !auth.email) {
            setToast({ kind: 'error', message: t('no_authenticated_email') });
            setUi(prev => ({ ...prev, loading: false }));
        }
    }, [auth, isEmailVerified, t]); 



    // SENDS A NEW VERIFICATION EMAIL TO THE USER'S ADDRESS
    const handleSendVerificationEmail = async () => {
        if (auth && auth.email) {
            setUi(prev => ({ ...prev, sending: true }));
            const res = await sendVerificationEmail();
            setUi(prev => ({ ...prev, sending: false }));
            
            if (res?.success) {
                setToast({ kind: 'success', message: res.message });
            } else if (res?.error) {
                setToast({ kind: 'error', message: res.error });
            }
        }
    };

    return {
        t,
        auth,
        ui,
        toast,
        setToast,
        handleSendVerificationEmail
    };
}
