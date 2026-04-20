import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Send as SendIcon } from '../../ui/icons';
import { AuthContext } from '../../hooks/AuthContext';
import useMessagesAndMultimedia from '../../hooks/useMessagesAndMultimedia';
import { get } from '../../api/http';

const ChatComponent = () => {
    const [messageContent, setMessageContent] = useState('');
    const location = useLocation();
    const providerEmail = location.state?.providerEmail || null;
    
    const { messages: allMessages, fetchMyMessages, createMessage, uploadMessage, joinChat } = useMessagesAndMultimedia();
    const { auth } = useContext(AuthContext);
    
    const [isSending, setIsSending] = useState(false);
    const [localError, setLocalError] = useState('');
    const [counterpartId, setCounterpartId] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Fetch counterpart user ID by email
    useEffect(() => {
        const fetchCounterpart = async () => {
            if (!providerEmail) {
                setLocalError('No se encontró información del proveedor. Vuelve a iniciar el chat desde proveedores.');
                return;
            }
            try {
                const res = await get(`/user/search?q=${providerEmail}`);
                if (res?.data?.length > 0) {
                    setCounterpartId(res.data[0]._id);
                    setLocalError('');
                } else {
                    setLocalError('Proveedor no encontrado en el sistema.');
                }
            } catch (err) {
                setLocalError('Error al buscar el proveedor.');
            }
        };
        fetchCounterpart();
    }, [providerEmail]);

    // Join socket room and fetch messages
    useEffect(() => {
        if (counterpartId && auth?._id) {
            joinChat(counterpartId);
            fetchMyMessages();
        }
    }, [counterpartId, auth?._id, joinChat, fetchMyMessages]);

    // Filter messages for this conversation and sort chronologically
    const messages = useMemo(() => {
        if (!allMessages || !counterpartId || !auth?._id) return [];
        return allMessages
            .filter(m => 
                (m.sender === auth._id && m.receiver === counterpartId) ||
                (m.sender === counterpartId && m.receiver === auth._id)
            )
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [allMessages, counterpartId, auth?._id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!counterpartId || (!messageContent.trim() && !fileInputRef.current?.files[0]) || isSending) return;
        setIsSending(true);
        try {
            const file = fileInputRef.current?.files[0];
            const payload = {
                receiverId: counterpartId,
                content: messageContent,
                type: file ? (file.type.startsWith('image/') ? 'image' : 'video') : 'text',
            };

            if (file) {
                await uploadMessage(file, payload);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                await createMessage(payload);
            }
            setMessageContent('');
            await fetchMyMessages();
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
                            {messages.map((message, index) => {
                                const isMe = message.sender === auth?._id;
                                return (
                                <li
                                    key={index}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-xl px-3 py-2 ${isMe ? 'bg-cyan-50 text-cyan-800' : 'bg-lime-50 text-lime-800'}`}
                                    >
                                        <p className="text-xs font-bold">
                                            {isMe ? 'You' : providerEmail}
                                        </p>

                                        {message.multimediaUrl && message.type === 'image' && (
                                            <img 
                                                src={message.multimediaUrl} 
                                                alt="adjunto" 
                                                className="mb-2 block max-w-full rounded-lg" 
                                            />
                                        )}
                                        {message.multimediaUrl && message.type === 'video' && (
                                            <video 
                                                src={message.multimediaUrl} 
                                                controls 
                                                className="mb-2 block max-w-full rounded-lg" 
                                            />
                                        )}
                                        {message.multimediaStatus === 'uploading' && <p className="text-xs italic opacity-80">Subiendo archivo...</p>}
                                        {message.multimediaStatus === 'processing' && <p className="text-xs italic opacity-80">Procesando archivo...</p>}

                                        <p className="text-sm">{message.content || message.message}</p>
                                    </div>
                                </li>
                            )})}
                            <div ref={messagesEndRef} />
                        </ul>
                    )}
                </div>

                <div className="border-t border-slate-200 bg-white p-4">
                    <div className="relative flex items-center gap-2">
                        <input
                            className="flex-1 rounded-xl border border-slate-300 py-2 pl-3 pr-12 text-sm outline-none focus:border-blue-500"
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
                        <label className="cursor-pointer flex items-center justify-center">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*,video/*"
                            />
                            <span className="text-xl text-slate-400 mr-8">📎</span>
                        </label>
                        <button
                            onClick={handleSendMessage}
                            disabled={!counterpartId || (!messageContent.trim() && !fileInputRef.current?.files[0]) || isSending}
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
