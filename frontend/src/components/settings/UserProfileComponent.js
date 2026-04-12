import React, { useEffect, useState, useContext } from 'react';
import PersonIcon from '@mui/icons-material/Person';
import useAuth from '../../hooks/useAuth';
import { AuthContext } from '../../hooks/AuthContext';
import * as profileService from '../../services/profile';

/* ── reusable sub-components ── */
function InputField({ id, label, value, onChange, type = 'text', required = false, placeholder = '' }) {
    return (
        <div className="settings-input-group">
            <label htmlFor={id} className="settings-label">
                {label}{required && <span className="settings-required-asterisk"> *</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                className="settings-input"
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
        <div className="settings-section-wrapper">
            <div className="settings-form-card">

                {/* Header */}
                <div className="settings-section-header">
                    <div className="settings-large-icon">
                        <PersonIcon className="settings-large-icon-inner" />
                    </div>
                    <h2 className="settings-title">Perfil de Usuario</h2>
                </div>

                <form
                    noValidate
                    autoComplete="off"
                    className="settings-form"
                    onSubmit={(e) => e.preventDefault()}
                >
                    {/* ── Nombre + Apellido ── */}
                    <div className="upc-grid-2">
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
                        className="settings-btn settings-btn-primary"
                        id="upc-save-btn"
                    >
                        {isSubmitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <span className="pinfo-spinner" />
                                Guardando...
                            </span>
                        ) : 'Guardar cambios'}
                    </button>

                    {remainingMinutes > 0 && (
                        <div className="settings-alert settings-alert-warning">
                            Espera {remainingMinutes} minuto(s) antes de volver a cambiar tu cuenta.
                        </div>
                    )}
                    {successMsg && <div className="settings-alert settings-alert-success">{successMsg}</div>}
                    {errorMsg   && <div className="settings-alert settings-alert-error">{errorMsg}</div>}
                </form>
            </div>
        </div>
    );
}

export default UserProfileComponent;
