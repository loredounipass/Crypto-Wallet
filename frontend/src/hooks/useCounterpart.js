import { useState, useEffect } from 'react';
import { get } from '../api/http';
import i18n from '../languages/i18n';




// CUSTOM HOOK THAT SEARCHES FOR A COUNTERPART USER BY THEIR EMAIL ADDRESS
export default function useCounterpart(counterpartEmail) {
  const [counterpartId, setCounterpartId] = useState(null);
  const [counterpartUser, setCounterpartUser] = useState(null);
  const [counterpartError, setCounterpartError] = useState('');




  // EFFECT THAT DEBOUNCES OR IMMEDIATELY FETCHES THE COUNTERPART INFO WHEN THE EMAIL CHANGES
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
          setCounterpartError(i18n.t('counterpart_not_found'));
        }
      } catch (e) {
        console.error('Failed to fetch counterpart user', e);
        setCounterpartId(null);
        setCounterpartError(e.message);
      }
    };
    fetchCounterpart();
  }, [counterpartEmail]);

  return { counterpartId, counterpartUser, counterpartError, setCounterpartError };
}
