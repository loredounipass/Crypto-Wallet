import { useState, use } from 'react';
import { useTranslation } from 'react-i18next';
import useAuth from '../../hooks/useAuth';
import { AuthContext } from '../../hooks/AuthContext';



// CUSTOM HOOK THAT MANAGES THE PASSWORD CHANGE PROCESS AND COOLDOWN LOGIC
export default function useChangePasswordLogic() {
    const { t } = useTranslation();
    const { changePassword } = useAuth();
    const { auth } = use(AuthContext);
    
    const [toast, setToast] = useState(null);

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    
    const [showPasswords, setShowPasswords] = useState({
        currentPassword: false,
        newPassword: false,
        confirmNewPassword: false
    });



    // HANDLES INPUT CHANGES FOR THE PASSWORD FIELDS
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };



    // TOGGLES THE VISIBILITY OF A SPECIFIC PASSWORD FIELD
    const handleTogglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const [isSubmitting, setIsSubmitting] = useState(false);



    // CALCULATE COOLDOWN TIME FOR PASSWORD CHANGES (10 MINUTES LIMIT)
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    let remainingMinutes = 0;
    if (auth && auth.lastPasswordChange) {
        const elapsed = Date.now() - auth.lastPasswordChange;
        if (elapsed < TEN_MINUTES_MS) {
            remainingMinutes = Math.ceil((TEN_MINUTES_MS - elapsed) / (60 * 1000));
        }
    }



    // SUBMITS THE PASSWORD CHANGE REQUEST AND HANDLES VALIDATION
    const handleChangePassword = async () => {
        if (passwords.newPassword !== passwords.confirmNewPassword) {
            setToast({ kind: 'error', message: t('passwords_dont_match') });
            return;
        }

        if (passwords.currentPassword === passwords.newPassword) {
            setToast({ kind: 'error', message: t('password_same_as_current') });
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await changePassword(passwords);
            if (res?.success) {
                setToast({ kind: 'success', message: res.message });
            } else if (res?.error) {
                setToast({ kind: 'error', message: res.error });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        t,
        toast,
        setToast,
        passwords,
        showPasswords,
        isSubmitting,
        remainingMinutes,
        handleChange,
        handleTogglePasswordVisibility,
        handleChangePassword
    };
}
