import React, { useState, useContext } from 'react';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import useAuth from '../../hooks/useAuth';
import { AuthContext } from '../../hooks/AuthContext';

function ChangePasswordComponent() {
    const { changePassword, successMessage, error } = useAuth();
    const { auth } = useContext(AuthContext);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    const handleTogglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    let remainingMinutes = 0;
    if (auth && auth.lastPasswordChange) {
        const elapsed = Date.now() - auth.lastPasswordChange;
        if (elapsed < TEN_MINUTES_MS) {
            remainingMinutes = Math.ceil((TEN_MINUTES_MS - elapsed) / (60 * 1000));
        }
    }

    const handleChangePassword = async () => {
        if (passwords.newPassword !== passwords.confirmNewPassword) {
            alert('Las nuevas contraseñas no coinciden.');
            return;
        }

        if (passwords.currentPassword === passwords.newPassword) {
            alert('La nueva contraseña no puede ser igual a la actual.');
            return;
        }

        try {
            setIsSubmitting(true);
            await changePassword(passwords);
        } finally {
            setIsSubmitting(false);
        }
    };

    const PasswordInput = ({ name, label, value, showPassword, onToggle }) => (
        <div className="settings-input-group">
            <label className="settings-label">
                {label} <span className="settings-required-asterisk">*</span>
            </label>
            <div className="settings-password-wrapper">
                <input
                    type={showPassword ? 'text' : 'password'}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    className="settings-input"
                    style={{ paddingRight: '2.5rem' }}
                    required
                />
                <button
                    type="button"
                    onClick={() => onToggle(name)}
                    className="settings-password-toggle"
                >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="settings-section-wrapper">
            <div className="settings-form-card">
                <div className="settings-section-header">
                    <div className="settings-large-icon">
                        <LockIcon className="settings-large-icon-inner" />
                    </div>
                    <h2 className="settings-title">
                        Cambiar Contraseña
                    </h2>
                </div>

                <form 
                    noValidate 
                    autoComplete="off" 
                    className="settings-form"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <PasswordInput
                        name="currentPassword"
                        label="Contraseña Actual"
                        value={passwords.currentPassword}
                        showPassword={showPasswords.currentPassword}
                        onToggle={handleTogglePasswordVisibility}
                    />
                    <PasswordInput
                        name="newPassword"
                        label="Nueva Contraseña"
                        value={passwords.newPassword}
                        showPassword={showPasswords.newPassword}
                        onToggle={handleTogglePasswordVisibility}
                    />
                    <PasswordInput
                        name="confirmNewPassword"
                        label="Confirmar Contraseña"
                        value={passwords.confirmNewPassword}
                        showPassword={showPasswords.confirmNewPassword}
                        onToggle={handleTogglePasswordVisibility}
                    />

                    <button
                        onClick={handleChangePassword}
                        disabled={isSubmitting || remainingMinutes > 0}
                        className="settings-btn settings-btn-primary"
                    >
                        {isSubmitting ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </button>

                    {remainingMinutes > 0 && (
                        <div className="settings-alert settings-alert-warning">
                            No puedes cambiar la contraseña por otros {remainingMinutes} minuto(s).
                        </div>
                    )}
                    {successMessage && (
                        <div className="settings-alert settings-alert-success">
                            {successMessage}
                        </div>
                    )}
                    {error && (
                        <div className="settings-alert settings-alert-error">
                            {error}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default ChangePasswordComponent;
