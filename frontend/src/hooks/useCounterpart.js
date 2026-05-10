import { useState, useEffect } from 'react';
import { get } from '../api/http';

export default function useCounterpart(counterpartEmail) {
  const [counterpartId, setCounterpartId] = useState(null);
  const [counterpartUser, setCounterpartUser] = useState(null);
  const [counterpartError, setCounterpartError] = useState('');

  useEffect(() => {
    const fetchCounterpart = async () => {
      if (!counterpartEmail) return;
      try {
        const res = await get('/user/search', { q: counterpartEmail });
        const users = Array.isArray(res?.data?.data)
          ? res.data.data
          : (Array.isArray(res?.data) ? res.data : []);
        if (users.length > 0) {
          setCounterpartId(users[0]._id);
          setCounterpartUser(users[0]);
          setCounterpartError('');
        } else {
          setCounterpartId(null);
          setCounterpartUser(null);
          setCounterpartError('No se encontró el usuario contraparte para esta orden.');
        }
      } catch (e) {
        console.error('Failed to fetch counterpart user', e);
        setCounterpartId(null);
        setCounterpartError('No se pudo resolver la contraparte. Intenta recargar la página.');
      }
    };
    fetchCounterpart();
  }, [counterpartEmail]);

  return { counterpartId, counterpartUser, counterpartError, setCounterpartError };
}
