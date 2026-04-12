import React, { useState, useContext } from 'react';
import {
    TextField,
    Button,
    Alert,
    Typography,
    InputAdornment,
    IconButton,
    Avatar
} from '../../ui/material';
import { Visibility } from '../../ui/icons';
import { VisibilityOff } from '../../ui/icons';
import { Lock as LockIcon } from '../../ui/icons';
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

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                <Avatar style={{ backgroundColor: '#1976D2', width: '48px', height: '48px' }}>
                    <LockIcon />
                </Avatar>
                <Typography variant="h6" component="h2" style={{ marginTop: '8px', fontWeight: 'bold' }}>
                    Cambiar Contraseña
                </Typography>
            </div>
            <form noValidate autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px', margin: '0 auto' }}>
                {['currentPassword', 'newPassword', 'confirmNewPassword'].map((field) => (
                    <TextField
                        key={field}
                        name={field}
                        label={field === 'currentPassword' ? 'Contraseña Actual' : field === 'newPassword' ? 'Nueva Contraseña' : 'Confirmar Contraseña'}
                        type={showPasswords[field] ? 'text' : 'password'}
                        variant="outlined"
                        value={passwords[field]}
                        onChange={handleChange}
                        required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label={`toggle ${field} visibility`}
                                        onClick={() => handleTogglePasswordVisibility(field)}
                                    >
                                        {showPasswords[field] ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                ))}
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleChangePassword}
                    disabled={isSubmitting || remainingMinutes > 0}
                    style={{ marginTop: '16px' }}
                >
                    {isSubmitting ? 'Cambiando...' : 'Cambiar Contraseña'}
                </Button>
                {remainingMinutes > 0 && (
                    <Alert severity="warning" style={{ marginTop: '16px' }}>
                        No puedes cambiar la contraseña por otros {remainingMinutes} minuto(s).
                    </Alert>
                )}
                {successMessage && <Alert severity="success" style={{ marginTop: '16px' }}>{successMessage}</Alert>}
                {error && <Alert severity="error" style={{ marginTop: '16px' }}>{error}</Alert>}
            </form>
        </>
    );
}

export default ChangePasswordComponent;
