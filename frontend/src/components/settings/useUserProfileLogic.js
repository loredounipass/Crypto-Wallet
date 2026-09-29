import { useEffect, useState, use, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useAuth from '../../hooks/useAuth';
import { AuthContext } from '../../hooks/AuthContext';
import * as profileService from '../../services/profile';



// CUSTOM HOOK THAT MANAGES THE USER PROFILE DATA FETCHING AND UPDATING
export default function useUserProfileLogic() {
    const { t } = useTranslation();
    const { updateUserProfile } = useAuth();
    const { auth } = use(AuthContext);

    // Account
    const [firstName, setFirstName]   = useState('');
    const [lastName, setLastName]     = useState('');
    const [email, setEmail]           = useState('');

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const initialized = useRef(false);
    const [toast, setToast]               = useState(null);



    // CALCULATE COOLDOWN TIME FOR PROFILE UPDATES (10 MINUTES LIMIT)
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    let remainingMinutes = 0;
    if (auth?.lastProfileUpdate) {
        const elapsed = Date.now() - auth.lastProfileUpdate;
        if (elapsed < TEN_MINUTES_MS) {
            remainingMinutes = Math.ceil((TEN_MINUTES_MS - elapsed) / 60_000);
        }
    }



    // INITIALIZES THE LOCAL STATE FROM AUTH CONTEXT AND FETCHES THE LATEST PROFILE DATA ONCE
    useEffect(() => {
        if (initialized.current) return;
        setFirstName(auth?.firstName || '');
        setLastName(auth?.lastName || '');
        setEmail(auth?.email || '');

        profileService.getMyProfile()
            .catch(() => {})
            .finally(() => { initialized.current = true; });
    }, [auth]);



    // HANDLES THE SAVE ACTION FOR THE USER PROFILE, UPDATING BOTH ACCOUNT AND PROFILE SERVICES
    const handleSave = async () => {

        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            setToast({ kind: 'error', message: t('fields_required') });
            return;
        }

        try {
            setIsSubmitting(true);

            // 1) Account update (only if something changed)
            const accountChanged =
                firstName !== (auth?.firstName || '') ||
                lastName  !== (auth?.lastName  || '') ||
                email     !== (auth?.email     || '');

            if (accountChanged) {
                const res = await updateUserProfile({ firstName, lastName, email });
                if (res?.error) {
                    setToast({ kind: 'error', message: res.error });
                    return;
                }
            }

            // 2) Profile upsert (always — cheap PATCH)
            await profileService.upsertProfile({
                firstName: firstName.trim(),
                lastName:  lastName.trim(),
            });

            setToast({ kind: 'success', message: t('profile_updated') });
        } catch (e) {
            setToast({ kind: 'error', message: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        t,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        email,
        setEmail,
        isSubmitting,
        toast,
        setToast,
        remainingMinutes,
        handleSave
    };
}
