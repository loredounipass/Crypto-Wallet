import React, { useEffect, useState, useContext } from 'react';
import {
    Typography,
    TextField,
    Button,
    Alert,
    Avatar
} from '../../ui/material';
import { Person as PersonIcon } from '../../ui/icons';
import useAuth from '../../hooks/useAuth';
import { AuthContext } from '../../hooks/AuthContext';

function UserProfileComponent() {
    const { updateUserProfile, error, successMessage } = useAuth();
    const { auth } = useContext(AuthContext);
    
    const [firstName, setFirstName] = useState(auth.firstName || '');
    const [lastName, setLastName] = useState(auth.lastName || '');
    const [email, setEmail] = useState(auth.email || '');
    const [localError, setLocalError] = useState('');
    const [localSuccessMessage, setLocalSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const TEN_MINUTES_MS = 10 * 60 * 1000;
    let remainingMinutes = 0;
    if (auth && auth.lastProfileUpdate) {
        const elapsed = Date.now() - auth.lastProfileUpdate;
        if (elapsed < TEN_MINUTES_MS) {
            remainingMinutes = Math.ceil((TEN_MINUTES_MS - elapsed) / (60 * 1000));
        }
    }

    useEffect(() => {
        if (auth) {
            setFirstName(auth.firstName || '');
            setLastName(auth.lastName || '');
            setEmail(auth.email || '');
        }
    }, [auth]);

    const handleUpdateProfile = async () => {
        setLocalError('');
        setLocalSuccessMessage('');

        if (!firstName || !lastName || !email) {
            setLocalError('Todos los campos son obligatorios.');
            return;
        }

        const firstNameChanged = firstName !== (auth.firstName || '');
        const lastNameChanged = lastName !== (auth.lastName || '');
        const emailChanged = email !== (auth.email || '');

        if (!firstNameChanged && !lastNameChanged && !emailChanged) {
            setLocalError('Debes proporcionar valores diferentes a los actuales');
            return;
        }

        const body = { firstName, lastName, email };
        try {
            setIsSubmitting(true);
            await updateUserProfile(body);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (successMessage) {
            setLocalSuccessMessage(successMessage);
        }
        if (error) {
            setLocalError(error);
        }
    }, [successMessage, error]);

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                <Avatar style={{ backgroundColor: '#1976D2', width: '48px', height: '48px' }}>
                    <PersonIcon />
                </Avatar>
                <Typography variant="h6" component="h2" style={{ marginTop: '8px', fontWeight: 'bold' }}>
                    Perfil de Usuario
                </Typography>
            </div>
            <form noValidate autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
                <TextField
                    label="Primer Nombre"
                    variant="outlined"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                />
                <TextField
                    label="Apellido"
                    variant="outlined"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                />
                <TextField
                    label="Correo Electrónico"
                    variant="outlined"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpdateProfile}
                    disabled={isSubmitting || remainingMinutes > 0}
                    style={{ marginTop: '16px' }}
                >
                    {isSubmitting ? 'Guardando...' : 'Actualizar Perfil'}
                </Button>
                {remainingMinutes > 0 && (
                    <Alert severity="warning" style={{ marginTop: '16px' }}>
                        No puedes actualizar tu perfil por otros {remainingMinutes} minuto(s).
                    </Alert>
                )}
                {localSuccessMessage && (
                    <Alert severity="success" style={{ marginTop: '16px' }}>
                        {localSuccessMessage}
                    </Alert>
                )}
                {localError && (
                    <Alert severity="error" style={{ marginTop: '16px' }}>
                        {localError}
                    </Alert>
                )}
            </form>
        </>
    );
}

export default UserProfileComponent;
