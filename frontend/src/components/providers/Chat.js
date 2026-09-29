import React from 'react';
import { Send as SendIcon } from '../../ui/icons';
import useChatLogic from './useChatLogic';

const ChatComponent = () => {
    const {
        t,
        auth,
        messageContent,
        setMessageContent,
        providerEmail,
        isSending,
        localError,
        counterpartId,
        fileInputRef,
        messages,
        handleSendMessage
    } = useChatLogic();

    return (
        <div className="mx-auto h-[calc(85vh-40px)] w-[85%] max-w-[800px] rounded-xl bg-slate-100 p-2">
            <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow">
                <div className="border-b border-slate-200 bg-white p-4">
                    <h2 className="text-center text-lg font-semibold text-slate-900">{t('p2p_chat_title')}</h2>
                </div>

                <div className="flex flex-1 flex-col justify-end bg-white p-4">
                    <div className="flex flex-1 flex-col justify-end overflow-auto">
                    {localError && (
                        <p className="mb-2 text-sm text-red-600">
                            {localError}
                        </p>
                    )}
                    {messages.length === 0 ? (
                        <p className="text-center text-sm text-slate-500">
                            {t('p2p_no_messages_chat')}
                        </p>
                    ) : (
                        <ul className="w-full space-y-2">
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
                                            {isMe ? t('p2p_you_label') : providerEmail}
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
                                            >
                                                <track kind="captions" />
                                            </video>
                                        )}
                                        {message.multimediaStatus === 'uploading' && <p className="text-xs italic opacity-80">{t('p2p_uploading_file')}</p>}
                                        {message.multimediaStatus === 'processing' && <p className="text-xs italic opacity-80">{t('p2p_processing_file')}</p>}

                                        <p className="text-sm">{message.content || message.message}</p>
                                    </div>
                                </li>
                            )})}
                        </ul>
                    )}
                    </div>
                </div>

                <div className="border-t border-slate-200 bg-white p-4">
                    <div className="relative flex items-center gap-2">
                        <input
                            className="flex-1 rounded-xl border border-slate-300 py-2 pl-3 pr-12 text-sm outline-none focus:border-blue-500"
                            placeholder={t('p2p_message_placeholder')}
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
                                accept="image/*"
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
