import React, { use } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../hooks/AuthContext';

// LISTA DE EMAILS ADMIN DEFINIDA EN LA VARIABLE DE ENTORNO DEL FRONTEND
// El backend valida independientemente — esto es solo UX protection
const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

export default function AdminRoute({ children }) {
    const { auth, loading } = use(AuthContext);

    if (loading) {
        return null;
    }

    if (!auth) {
        return <Navigate to='/login' replace />;
    }

    const isEnvAdmin = ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes((auth.email || '').toLowerCase());
    const isDbAdmin = auth.isAdmin === true;
    
    const isAdmin = isDbAdmin || isEnvAdmin;

    if (!isAdmin) {
        return <Navigate to='/' replace />;
    }

    return children;
}
