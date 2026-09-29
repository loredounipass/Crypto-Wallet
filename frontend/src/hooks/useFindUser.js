import { useState, useEffect } from 'react';
import User from '../services/user'



// CUSTOM HOOK THAT INITIALIZES AND RETRIEVES THE AUTHENTICATED USER DATA ON LOAD
export default function useFindUser() {
    const [auth, setAuth] = useState(null);
    const [loading, setLoading] = useState(true);



    // EFFECT THAT FETCHES THE CURRENT USER INFORMATION AND UPDATES THE STATE
    useEffect(() => {
        async function findUser() {
            try {
                const { data } = await User.getInfo()
                if (data && 'data' in data)
                    setAuth(data.data)
            } catch (err) { }

            setLoading(false);
        }

        findUser()
    }, [])


    return {
        auth,
        loading,
        setAuth
    }
}