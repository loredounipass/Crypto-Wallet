import React, { use } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../hooks/AuthContext';

export default function PrivateRoute({ children }) {
    const { auth, loading } = use(AuthContext);

    if (loading) {
        return <></>
    }

    if (!auth) {
        return <Navigate to='/login' replace />
    }

    return children;
}