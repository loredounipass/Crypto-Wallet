import React, { useState, useContext } from 'react';
import {
    Visibility,
    VisibilityOff,
    Lock as LockIcon,
} from '../../ui/icons';
import useAuth from '../../hooks/useAuth';
import { AuthContext } from '../../hooks/AuthContext';

import './Settings.css';


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
        <div className="mb-5 flex flex-col">
            <label className="mb-2 text-sm font-medium" style={{ color: 'var(--settings-muted)' }}>
                {label} <span style={{ color: 'var(--settings-danger)' }}>*</span>
            </label>
            <div className="relative flex items-center">
                <input
                    type={showPassword ? 'text' : 'password'}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    className="w-full rounded-xl border px-4 py-3 pr-10 text-sm outline-none transition-colors focus:border-[#2186EB]"
                    style={{ 
                        borderColor: 'var(--settings-border)', 
                        backgroundColor: 'var(--settings-bg)', 
                        color: 'var(--settings-text)' 
                    }}
                    required
                />
                <button
                    type="button"
                    onClick={() => onToggle(name)}
                    className="absolute right-3 flex items-center justify-center border-0 bg-transparent p-0"
                    style={{ color: 'var(--settings-muted)' }}
                >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="w-full">
            <div className="border-0 bg-transparent p-0 shadow-none">
                <div className="mb-6 flex items-center gap-4 border-b pb-4" style={{ borderColor: 'var(--settings-border)' }}>
                    <div className="flex items-center justify-center rounded-xl bg-[rgba(33,134,235,0.1)] p-3">
                        <LockIcon className="text-[28px]" style={{ color: 'var(--settings-primary)' }} />
                    </div>
                    <h2 className="m-0 text-[20px] font-semibold" style={{ color: 'var(--settings-text)' }}>
                        Cambiar Contraseña
                    </h2>
                </div>

                <form 
                    noValidate 
                    autoComplete="off" 
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
                        className="box-border w-full cursor-pointer rounded-xl border-0 px-6 py-[14px] text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ backgroundColor: 'var(--settings-primary)' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--settings-primary-hover)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--settings-primary)'}
                    >
                        {isSubmitting ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </button>

                    {remainingMinutes > 0 && (
                        <div className="mt-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ 
                            border: '1px solid rgba(245,158,11,0.2)', 
                            backgroundColor: 'rgba(245,158,11,0.1)', 
                            color: 'var(--settings-warning)' 
                        }}>
                            No puedes cambiar la contraseña por otros {remainingMinutes} minuto(s).
                        </div>
                    )}
                    {successMessage && (
                        <div className="mt-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ 
                            border: '1px solid rgba(34,197,94,0.2)', 
                            backgroundColor: 'rgba(34,197,94,0.1)', 
                            color: 'var(--settings-success)' 
                        }}>
                            {successMessage}
                        </div>
                    )}
                    {error && (
                        <div className="mt-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ 
                            border: '1px solid rgba(239,68,68,0.2)', 
                            backgroundColor: 'rgba(239,68,68,0.1)', 
                            color: 'var(--settings-danger)' 
                        }}>
                            {error}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default ChangePasswordComponent;
