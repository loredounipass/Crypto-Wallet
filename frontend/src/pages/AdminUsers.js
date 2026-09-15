import React, { useState } from 'react';
import User from '../services/user';
import TransactionToast from '../components/TransactionToast';

export default function AdminUsers() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const handleToggle = async (isAdmin) => {
        if (!email.trim()) {
            setToast({ kind: 'error', message: 'Por favor, ingresa un correo electrónico.' });
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await User.toggleAdmin({ targetEmail: email.trim().toLowerCase(), isAdmin });
            if (data && data.message) {
                setToast({ kind: 'success', message: data.message });
                setEmail('');
            } else if (data && data.error) {
                setToast({ kind: 'error', message: data.error });
            }
        } catch (error) {
            setToast({ kind: 'error', message: error.message || 'Error al cambiar rol del usuario.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ paddingBottom: 40, maxWidth: 800, margin: '0 auto', width: '100%' }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.5px' }}>
                    Gestión de Administradores
                </h1>
                <p style={{ margin: '6px 0 0', fontSize: 14, color: '#94A3B8' }}>
                    Promueve o degrada a usuarios del sistema. Ingresa el correo exacto del usuario.
                </p>
            </div>

            <div style={{
                background: 'linear-gradient(180deg, #131327 0%, #0C0C17 100%)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 16, padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>
                        Correo Electrónico del Usuario
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        style={{
                            width: '100%',
                            background: '#080811',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 10,
                            padding: '14px 16px',
                            color: '#fff',
                            fontSize: 15,
                            outline: 'none',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => handleToggle(true)}
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.3)',
                            color: '#10B981',
                            borderRadius: 10,
                            padding: '14px',
                            fontSize: 14, fontWeight: 700,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                        }}
                    >
                        Hacer Administrador
                    </button>
                    <button
                        onClick={() => handleToggle(false)}
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#EF4444',
                            borderRadius: 10,
                            padding: '14px',
                            fontSize: 14, fontWeight: 700,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                        }}
                    >
                        Quitar Administrador
                    </button>
                </div>
            </div>

            <TransactionToast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
}
