import React, { createContext, use, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return use(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const { auth } = use(AuthContext);
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!auth?._id) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        const socketOrigin = new URL(process.env.REACT_APP_API_BASE_URL).origin;

        const newSocket = io(`${socketOrigin}/messages`, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            setConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            setConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error('[SocketContext] ⚠️ Connection error:', err.message);
        });

        newSocket.on('error', (err) => {
            console.error('[SocketContext] ⚠️ Socket error:', err);
        });

        newSocket.on('receiveMessage', (message) => {
            setMessages((prev) => {
                const isDuplicate = prev.some((m) => m._id === message._id);
                if (isDuplicate) return prev;
                return [...prev, message];
            });
        });

        newSocket.on('messageUpdated', (message) => {
            setMessages((prev) => {
                const idx = prev.findIndex((m) => m._id === message._id);
                if (idx === -1) return [...prev, message];
                const next = [...prev];
                next[idx] = { ...next[idx], ...message };
                return next;
            });
        });

        newSocket.on('typing', (data) => {
            console.log('[SocketContext] ⌨️ typing event:', data);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth?._id]);

    const joinChat = useCallback((otherUserId) => {
        if (socket && otherUserId) {
            socket.emit('joinChat', { otherUserId });
        }
    }, [socket]);

    return (
        <SocketContext.Provider value={{ socket, connected, messages, setMessages, joinChat }}>
            {children}
        </SocketContext.Provider>
    );
};
