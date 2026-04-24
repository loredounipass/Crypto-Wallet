import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const { auth } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!auth?.token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        const fallbackBaseApi = 'https://orange-spoon-5j4gqrq49prf7j6r-4000.app.github.dev';
        const socketOrigin = (() => {
            try { 
                return new URL(process.env.REACT_APP_API_BASE_URL).origin; 
            } catch (_) { 
                return fallbackBaseApi; 
            }
        })();

        const newSocket = io(socketOrigin, {
            withCredentials: true,
            path: '/socket.io',
        });

        newSocket.on('connect', () => {
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            setConnected(false);
        });

        newSocket.on('receiveMessage', (message) => {
            setMessages((prev) => {
                const isDuplicate = prev.some((m) => m._id === message._id);
                if (isDuplicate) return prev;
                return [...prev, message];
            });
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth?.token]);

    const joinChat = useCallback((chatId) => {
        if (socket && chatId) {
            socket.emit('joinChat', chatId);
        }
    }, [socket]);

    return (
        <SocketContext.Provider value={{ socket, connected, messages, setMessages, joinChat }}>
            {children}
        </SocketContext.Provider>
    );
};
