import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Send as SendIcon } from '../../ui/icons';
import { AuthContext } from '../../hooks/AuthContext';
import useProviders from '../../hooks/useProviders';

const ChatComponent = () => {
    const [messageContent, setMessageContent] = useState('');
    const location = useLocation();
    const chatroomId = location.state?.chatroomId || null;
    const { messages, sendMessageAsUser, getMessages } = useProviders();
    const { auth } = useContext(AuthContext);
    const [isSending, setIsSending] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        const fetchMessages = async () => {
            if (!chatroomId) {
                setLocalError('No se encontró una sesión de chat válida. Vuelve a iniciar el chat desde proveedores.');
                return;
            }
            await getMessages(chatroomId);
        };
        fetchMessages();
    }, [chatroomId, getMessages]);

    const handleSendMessage = async () => {
      if (!chatroomId || !messageContent.trim() || isSending) return;
      setIsSending(true);
      try {
          await sendMessageAsUser({
            sender: auth.email,
            chatroomId,
            message: messageContent,
          });
          setMessageContent('');
          await getMessages(chatroomId);
      } catch (error) {
          setLocalError('No se pudo enviar el mensaje. Intenta de nuevo.');
      } finally {
          setIsSending(false);
      }
  };
  

    return (
        <div className="mx-auto h-[calc(85vh-40px)] w-[85%] max-w-[800px] rounded-xl bg-slate-100 p-2">
            <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow">
                <div className="border-b border-slate-200 bg-white p-4">
                    <h2 className="text-center text-lg font-semibold text-slate-900">Chat</h2>
                </div>

                <div className="flex-1 overflow-auto bg-white p-4">
                    {localError && (
                        <p className="mb-2 text-sm text-red-600">
                            {localError}
                        </p>
                    )}
                    {messages.length === 0 ? (
                        <p className="text-center text-sm text-slate-500">
                            Aún no hay mensajes
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {messages.map((message, index) => (
                                <li
                                    key={index}
                                    className={`flex ${message.sender === auth.email ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-xl px-3 py-2 ${message.sender === auth.email ? 'bg-cyan-50 text-cyan-800' : 'bg-lime-50 text-lime-800'}`}
                                    >
                                        <p className="text-xs font-bold">
                                            {message.sender === auth.email ? 'You' : message.sender}
                                        </p>
                                        <p className="text-sm">{message.message}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="border-t border-slate-200 bg-white p-4">
                    <div className="relative">
                        <input
                            className="w-full rounded-xl border border-slate-300 py-2 pl-3 pr-12 text-sm outline-none focus:border-blue-500"
                        placeholder="Escribe tu mensaje..."
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!chatroomId || !messageContent.trim() || isSending}
                            className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                        >
                            {isSending ? (
                                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <SendIcon />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatComponent;
