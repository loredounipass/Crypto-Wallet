import { useState, useCallback, useRef } from 'react';
import Support from '../services/support';
import { typewriter } from '../utils/typewriter';

export default function useSupport() {
    const [messages, setMessages] = useState([
        { text: 'Hola! Soy Brivo Agent, tu asistente virtual. En que puedo ayudarte?', sender: 'agent' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState(null);
    const cancelRef = useRef(null);

    const cancelResponse = useCallback(() => {
        if (cancelRef.current) {
            cancelRef.current();
            cancelRef.current = null;
            setIsTyping(false);
            setIsLoading(false);
        }
    }, []);

    const sendMessage = useCallback(async (text) => {
        setMessages(prev => [...prev, { text, sender: 'user' }]);
        setIsLoading(true);
        setError(null);

        try {
            const res = await Support.sendMessage(text);
            setIsLoading(false);

            const fullText = res.response;
            setMessages(prev => [...prev, { text: '', sender: 'agent' }]);
            setIsTyping(true);

            const { promise, cancel } = typewriter(fullText, (current) => {
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { text: current, sender: 'agent' };
                    return updated;
                });
            }, { speed: 20 });

            cancelRef.current = cancel;
            await promise;
            cancelRef.current = null;
            setIsTyping(false);
            return res;
        } catch (err) {
            setIsLoading(false);
            setIsTyping(false);
            const errMsg = err.message || 'Error al comunicarse con el asistente.';
            setError(errMsg);
            setMessages(prev => [...prev, { text: `Error: ${errMsg}`, sender: 'agent' }]);
            throw err;
        }
    }, []);

    return {
        messages,
        isLoading,
        isTyping,
        error,
        sendMessage,
        cancelResponse,
    };
}
