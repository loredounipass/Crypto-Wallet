import React, { useEffect, useState, useContext, useCallback } from 'react';
import useProvider from '../../hooks/useProviders';
import { AuthContext } from '../../hooks/AuthContext';
import { useHistory } from 'react-router-dom';

export default function ProviderCard() {
  const { getAllProviders, createChat } = useProvider();
  const { auth } = useContext(AuthContext);
  const history = useHistory();
  const [providers, setProviders] = useState([]);
  const [error, setError] = useState(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await getAllProviders();
      if (res && res.length > 0) {
        setProviders(res);
        setError(null);
      } else {
        setError({ message: 'No se encontraron proveedores.' });
        setProviders([]);
      }
    } catch (err) {
      setError(err);
      setProviders([]);
    }
  }, [getAllProviders]);

  const handleCreateChat = async (providerEmail) => {
    if (!auth?.email || isCreatingChat) return;
    
    setIsCreatingChat(true);
    
    try {
      const chatBody = {
        chatName: `Chat con ${providerEmail}`,
        users: [auth.email, providerEmail],
        latestMessage: 'Chat iniciado'
      };

      const response = await createChat(chatBody);
      
      if (response?.chatroomId) {
        history.push('/chat', {
          chatroomId: response.chatroomId,
          providerEmail,
        });
      } else {
        throw new Error('No se recibió un ID de chat válido');
      }
    } catch (err) {
      console.error('Error al crear el chat:', err);
      alert(`Error al crear el chat: ${err.message}`);
    } finally {
      setIsCreatingChat(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return (
    <div className="p-3">
      {error && (
        <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message || 'Ocurrió un error al cargar los proveedores.'}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {providers.map((provider) => (
          <div key={provider._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  {provider.firstName} {provider.lastName}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Correo electrónico: {provider.email}
                </p>
                <div className="mt-3">
                  <button
                    className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={() => handleCreateChat(provider.email)}
                    disabled={isCreatingChat}
                    type="button"
                  >
                    {isCreatingChat ? (
                      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Vender P2P'
                    )}
                  </button>
                </div>
          </div>
        ))}
      </div>
    </div>
  );
}
