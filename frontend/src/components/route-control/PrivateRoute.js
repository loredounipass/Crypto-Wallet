import React, { use } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { AuthContext } from '../../hooks/AuthContext';

export default function PrivateRoute(props) {
    const { auth, loading } = use(AuthContext);
    const { component: Component, ...rest } = props;

    if (loading) {
        return <></>
    }

    if (auth) {
        return (<Route {...rest} render={(props) =>
            (<Component {...props} />)
        }
        />
        )
    }

    return <Redirect to='/login' />
}