/**
 * useMessagesAndMultimedia
 *
 * Consumes the shared SocketContext (singleton socket) and wraps the
 * HTTP service calls for messages/multimedia. No socket is created here.
 */
import { useContext } from 'react';
import MessagesAndMultimedia from '../services/messagesAndMultimedia';
import { AuthContext } from './AuthContext';
import { useSocket } from './SocketContext';

export default function useMessagesAndMultimedia() {
  const { auth } = useContext(AuthContext);
  const { connected, messages, setMessages, joinChat } = useSocket();

  /* ── Fetch all messages for the current user ─────────────────── */
  const fetchMyMessages = async () => {
    try {
      const resp = await MessagesAndMultimedia.getMyMessages();
      const data = resp?.data;
      let list = [];
      if (data && data.data && Array.isArray(data.data)) list = data.data;
      else if (Array.isArray(data)) list = data;

      if (list.length > 0) {
        // Deduplicate by _id and merge with any socket-delivered messages
        setMessages(prev => {
          const map = new Map(prev.map(m => [m._id, m]));
          for (const it of list) {
            if (it && it._id) map.set(it._id, { ...map.get(it._id), ...it });
          }
          return Array.from(map.values());
        });
      } else {
        setMessages(prev => (prev.length === 0 ? [] : prev));
      }
      return resp;
    } catch (err) {
      console.error('[useMessagesAndMultimedia] fetchMyMessages', err);
      return null;
    }
  };

  /* ── Create a text / metadata-only message ───────────────────── */
  const createMessage = async (dto) => {
    try {
      if (!auth?._id) return null;
      const payload = { ...dto, senderId: dto?.senderId || auth._id };
      if (!payload.receiverId) return null;
      return await MessagesAndMultimedia.createMessage(payload);
    } catch (err) {
      console.error('[useMessagesAndMultimedia] createMessage', err);
      return null;
    }
  };

  /* ── Upload a file and create message ────────────────────────── */
  const uploadMessage = async (file, dto = {}) => {
    try {
      if (!auth?._id) return null;
      const payload = { ...dto, senderId: dto?.senderId || auth._id };
      if (!payload.receiverId) return null;
      return await MessagesAndMultimedia.uploadMessage(file, payload);
    } catch (err) {
      console.error('[useMessagesAndMultimedia] uploadMessage', err);
      return null;
    }
  };

  return {
    messages,
    connected,
    fetchMyMessages,
    createMessage,
    uploadMessage,
    joinChat,
  };
}
