import React, { useEffect, useState, useContext } from 'react';
import { Person as PersonIcon } from '../../ui/icons';
import useAuth from '../../hooks/useAuth';
import { AuthContext } from '../../hooks/AuthContext';
import * as profileService from '../../services/profile';


/* ── reusable sub-components ── */
function InputField({ id, label, value, onChange, type = 'text', required = false, placeholder = '' }) {
    
    
    return (
        <div className="mb-5 flex flex-col">
            <label htmlFor={id} className={`${'text-[#9CA3AF]'} mb-2 text-sm font-medium`}>
                {label}{required && <span className="text-[#ef4444]"> *</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                className={`box-border w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${'border-[#2D2D44] bg-[#0F0F1A] text-white'} focus:border-[#2186EB]`}
                placeholder={placeholder}
                required={required}
            />
        </div>
    );
}

/* ── main ── */
function UserProfileComponent() {
    const { updateUserProfile, error: authError, successMessage: authSuccess } = useAuth();
    const { auth } = useContext(AuthContext);
    
    

    // Account
    const [firstName, setFirstName]   = useState('');
    const [lastName, setLastName]     = useState('');
    const [email, setEmail]           = useState('');

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg]         = useState('');
    const [successMsg, setSuccessMsg]     = useState('');
    const [initialized, setInitialized]   = useState(false);

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
        if (initialized) return;
        setFirstName(auth?.firstName || '');
        setLastName(auth?.lastName || '');
        setEmail(auth?.email || '');

        profileService.getMyProfile()
            .catch(() => {})
            .finally(() => setInitialized(true));
    }, [initialized, auth]);

    // Sync auth hook messages
    useEffect(() => {
        if (authSuccess) setSuccessMsg(authSuccess);
        if (authError)   setErrorMsg(authError);
    }, [authSuccess, authError]);

    /* ── single save handler ── */
    const handleSave = async () => {
        setErrorMsg('');
        setSuccessMsg('');

        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            setErrorMsg('Nombre, apellido y correo son obligatorios.');
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
                await updateUserProfile({ firstName, lastName, email });
            }

            // 2) Profile upsert (always — cheap PATCH)
            await profileService.upsertProfile({
                firstName: firstName.trim(),
                lastName:  lastName.trim(),
            });

            setSuccessMsg('¡Perfil actualizado correctamente!');
        } catch (e) {
            setErrorMsg(e?.response?.data?.message || 'Error al guardar los cambios.');
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ── render ── */
    return (
        <div className="w-full">
            <div className="border-0 bg-transparent p-0 shadow-none">

                {/* Header */}
                <div className={`mb-6 flex items-center gap-4 border-b pb-4 ${'border-[#2D2D44]'}`}>
                    <div className="flex items-center justify-center rounded-xl bg-[rgba(33,134,235,0.1)] p-3">
                        <PersonIcon className="text-[28px] text-[#2186EB]" />
                    </div>
                    <h2 className={`m-0 text-[20px] font-semibold ${'text-white'}`}>Perfil de Usuario</h2>
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
                            label="Primer Nombre"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            placeholder="Tu nombre"
                        />
                        <InputField
                            id="upc-lastName"
                            label="Apellido"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            placeholder="Tu apellido"
                        />
                    </div>

                    {/* ── Email ── */}
                    <InputField
                        id="upc-email"
                        label="Correo Electrónico"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="tu@correo.com"
                    />

                    {/* ── Single save button ── */}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSubmitting || remainingMinutes > 0}
                        className="box-border w-full cursor-pointer rounded-xl border-0 bg-[#2186EB] px-6 py-[14px] text-sm font-semibold text-white transition-all hover:bg-[#1A6BC7] disabled:cursor-not-allowed disabled:opacity-60"
                        id="upc-save-btn"
                    >
                        {isSubmitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.3)] border-t-white" />
                                Guardando...
                            </span>
                        ) : 'Guardar cambios'}
                    </button>

                    {remainingMinutes > 0 && (
                        <div className="mt-4 rounded-xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.1)] px-4 py-3 text-sm font-medium text-[#f59e0b]">
                            Espera {remainingMinutes} minuto(s) antes de volver a cambiar tu cuenta.
                        </div>
                    )}
                    {successMsg && <div className="mt-4 rounded-xl border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.1)] px-4 py-3 text-sm font-medium text-[#22c55e]">{successMsg}</div>}
                    {errorMsg   && <div className="mt-4 rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm font-medium text-[#ef4444]">{errorMsg}</div>}
                </form>
            </div>
        </div>
    );
}

export default UserProfileComponent;
