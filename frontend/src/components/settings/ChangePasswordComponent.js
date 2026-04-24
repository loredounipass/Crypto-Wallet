import React, { useState, useContext } from 'react';
import {
    Visibility,
    VisibilityOff,
    Lock as LockIcon,
} from '../../ui/icons';
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
        <div className="mb-5 flex flex-col">
            <label className={`${'text-[#9CA3AF]'} mb-2 text-sm font-medium`}>
                {label} <span className="text-[#ef4444]">*</span>
            </label>
            <div className="relative flex items-center">
                <input
                    type={showPassword ? 'text' : 'password'}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    className={`w-full rounded-xl border px-4 py-3 pr-10 text-sm outline-none transition-colors ${'border-[#2D2D44] bg-[#0F0F1A] text-white'} focus:border-[#2186EB]`}
                    required
                />
                <button
                    type="button"
                    onClick={() => onToggle(name)}
                    className={`absolute right-3 flex items-center justify-center border-0 bg-transparent p-0 ${'text-[#9CA3AF]'}`}
                >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="w-full">
            <div className="border-0 bg-transparent p-0 shadow-none">
                <div className={`mb-6 flex items-center gap-4 border-b pb-4 ${'border-[#2D2D44]'}`}>
                    <div className="flex items-center justify-center rounded-xl bg-[rgba(33,134,235,0.1)] p-3">
                        <LockIcon className="text-[28px] text-[#2186EB]" />
                    </div>
                    <h2 className={`m-0 text-[20px] font-semibold ${'text-white'}`}>
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
                        className="box-border w-full cursor-pointer rounded-xl border-0 bg-[#2186EB] px-6 py-[14px] text-sm font-semibold text-white transition-all hover:bg-[#1A6BC7] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </button>

                    {remainingMinutes > 0 && (
                        <div className="mt-4 rounded-xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.1)] px-4 py-3 text-sm font-medium text-[#f59e0b]">
                            No puedes cambiar la contraseña por otros {remainingMinutes} minuto(s).
                        </div>
                    )}
                    {successMessage && (
                        <div className="mt-4 rounded-xl border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.1)] px-4 py-3 text-sm font-medium text-[#22c55e]">
                            {successMessage}
                        </div>
                    )}
                    {error && (
                        <div className="mt-4 rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm font-medium text-[#ef4444]">
                            {error}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default ChangePasswordComponent;
