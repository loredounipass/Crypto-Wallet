import React, { useEffect, useState, use } from 'react';
import { useTranslation } from 'react-i18next';
import { Person as PersonIcon } from '../../ui/icons';
import useAuth from '../../hooks/useAuth';
import { AuthContext } from '../../hooks/AuthContext';
import * as profileService from '../../services/profile';
import TransactionToast from '../TransactionToast';

import './Settings.css';


/* ── reusable sub-components ── */
function InputField({ id, label, value, onChange, type = 'text', required = false, placeholder = '' }) {
    
    
    return (
        <div className="mb-5 flex flex-col">
            <label htmlFor={id} className="mb-2 text-sm font-medium" style={{ color: 'var(--settings-muted)' }}>
                {label}{required && <span style={{ color: 'var(--settings-danger)' }}> *</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                className="box-border w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[#2186EB]"
                style={{ 
                    borderColor: 'var(--settings-border)', 
                    backgroundColor: 'var(--settings-bg)', 
                    color: 'var(--settings-text)' 
                }}
                placeholder={placeholder}
                required={required}
            />
        </div>
    );
}

/* ── main ── */
function UserProfileComponent() {
    const { t } = useTranslation();
    const { updateUserProfile } = useAuth();
    const { auth } = use(AuthContext);
    
    

    // Account
    const [firstName, setFirstName]   = useState('');
    const [lastName, setLastName]     = useState('');
    const [email, setEmail]           = useState('');

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const initialized = React.useRef(false);
    const [toast, setToast]               = useState(null);

    // Cooldown guard
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    let remainingMinutes = 0;
    if (auth?.lastProfileUpdate) {
        const elapsed = Date.now() - auth.lastProfileUpdate;
        if (elapsed < TEN_MINUTES_MS) {
            remainingMinutes = Math.ceil((TEN_MINUTES_MS - elapsed) / 60_000);
        }
    }

    // Init everything from auth + API once
    useEffect(() => {
        if (initialized.current) return;
        setFirstName(auth?.firstName || '');
        setLastName(auth?.lastName || '');
        setEmail(auth?.email || '');

        profileService.getMyProfile()
            .catch(() => {})
            .finally(() => { initialized.current = true; });
    }, [auth]);



    /* ── single save handler ── */
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

    /* ── render ── */
    return (
        <div className="w-full">
            <div className="border-0 bg-transparent p-0 shadow-none">

                {/* Header */}
                <div className="mb-6 flex items-center gap-4 border-b pb-4" style={{ borderColor: 'var(--settings-border)' }}>
                    <div className="flex items-center justify-center rounded-xl bg-[rgba(33,134,235,0.1)] p-3">
                        <PersonIcon className="text-[28px]" style={{ color: 'var(--settings-primary)' }} />
                    </div>
                    <h2 className="m-0 text-[20px] font-semibold" style={{ color: 'var(--settings-text)' }}>{t('user_profile_title')}</h2>
                </div>

                <form
                    noValidate
                    autoComplete="off"
                    onSubmit={(e) => e.preventDefault()}
                >
                    {/* ── Nombre + Apellido ── */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InputField
                            id="upc-firstName"
                            label={t('first_name')}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            placeholder={t('first_name_placeholder')}
                        />
                        <InputField
                            id="upc-lastName"
                            label={t('last_name')}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            placeholder={t('last_name_placeholder')}
                        />
                    </div>

                    {/* ── Email ── */}
                    <InputField
                        id="upc-email"
                        label={t('email')}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder={t('email_placeholder')}
                    />

                    {/* ── Single save button ── */}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSubmitting || remainingMinutes > 0}
                        className="box-border w-full cursor-pointer rounded-xl border-0 px-6 py-[14px] text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ backgroundColor: 'var(--settings-primary)' }}
                        id="upc-save-btn"
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--settings-primary-hover)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--settings-primary)'}
                    >
                        {isSubmitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.3)] border-t-white" />
                                {t('saving')}
                            </span>
                        ) : t('save_changes')}
                    </button>

                    {remainingMinutes > 0 && (
                        <div className="mt-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ 
                            border: '1px solid rgba(245,158,11,0.2)', 
                            backgroundColor: 'rgba(245,158,11,0.1)', 
                            color: 'var(--settings-warning)' 
                        }}>
                            {t('profile_cooldown', { minutes: remainingMinutes })}
                        </div>
                    )}
                </form>
            </div>
            <TransactionToast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
}

export default UserProfileComponent;
