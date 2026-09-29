import { useEffect, useState, use, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useProvider from '../../hooks/useProviders';
import { AuthContext } from '../../hooks/AuthContext';
import { useNavigate } from 'react-router-dom';



// CUSTOM HOOK THAT FETCHES THE LIST OF PROVIDERS AND HANDLES THE CREATION OF A P2P CHAT
export default function useProviderCardLogic() {
  const { t } = useTranslation();
  const { getAllProviders } = useProvider();
  const { auth } = use(AuthContext);
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [error, setError] = useState(null);
  const [isCreatingChat] = useState(false);



  // FETCHES THE LIST OF PROVIDERS AND UPDATES LOCAL STATE
  const fetchProviders = useCallback(async () => {
    try {
      const res = await getAllProviders();
      if (res && res.length > 0) {
        setProviders(res);
        setError(null);
      } else {
        setError({ message: t('p2p_no_providers_found') });
        setProviders([]);
      }
    } catch (err) {
      setError(err);
      setProviders([]);
    }
  }, [getAllProviders, t]);



  // NAVIGATES THE USER TO THE CHAT PAGE WITH THE SELECTED PROVIDER EMAIL
  const handleCreateChat = async (providerEmail) => {
    if (!auth?.email) return;
    
    // Ahora simplemente redirigimos al chat usando el correo del proveedor
    // El componente Chat se encargará de buscar el ID y unirse al room del nuevo sistema
    navigate('/chat', {
      providerEmail,
    });
  };



  // EFFECT TO INITIALIZE PROVIDERS ON MOUNT
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return {
    t,
    providers,
    error,
    isCreatingChat,
    handleCreateChat
  };
}
