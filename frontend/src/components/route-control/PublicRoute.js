import React, { use } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../hooks/AuthContext';

export default function PublicRoute({ children }) {
    const { auth, loading } = use(AuthContext);

    if (loading) {
        return <></>
    }

    if (auth) {
        return <Navigate to='/' replace />
    }

    return children;
}