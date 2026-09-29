import { use, useCallback } from 'react';
import MessagesAndMultimedia from '../services/messagesAndMultimedia';
import { AuthContext } from './AuthContext';
import { useSocket } from './SocketContext';



// CUSTOM HOOK THAT MANAGES DIRECT MESSAGING AND MULTIMEDIA FEATURES
export default function useMessagesAndMultimedia() {
  const { auth } = use(AuthContext);
  const { connected, messages, setMessages, joinChat } = useSocket();




  // FETCHES ALL CONVERSATION MESSAGES FOR THE AUTHENTICATED USER
  const fetchMyMessages = useCallback(async () => {
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
  }, [setMessages]);




  // SENDS A NEW TEXT-BASED OR METADATA-ONLY DIRECT MESSAGE
  const createMessage = useCallback(async (dto) => {
    try {
      if (!auth?._id) return null;
      const payload = { ...dto, senderId: dto?.senderId || auth._id };
      if (!payload.receiverId) return null;
      return await MessagesAndMultimedia.createMessage(payload);
    } catch (err) {
      console.error('[useMessagesAndMultimedia] createMessage', err);
      return null;
    }
  }, [auth?._id]);




  // UPLOADS A MULTIMEDIA FILE AND SENDS IT AS A DIRECT MESSAGE
  const uploadMessage = useCallback(async (file, dto = {}) => {
    try {
      if (!auth?._id) return null;
      const payload = { ...dto, senderId: dto?.senderId || auth._id };
      if (!payload.receiverId) return null;
      return await MessagesAndMultimedia.uploadMessage(file, payload);
    } catch (err) {
      console.error('[useMessagesAndMultimedia] uploadMessage', err);
      return null;
    }
  }, [auth?._id]);




  // FETCHES A SECURE BLOB URL FOR A GIVEN PROTECTED MEDIA RESOURCE
  const getSecureMedia = useCallback(async (url) => {
    try {
      return await MessagesAndMultimedia.getSecureMedia(url);
    } catch (err) {
      console.error('[useMessagesAndMultimedia] getSecureMedia', err);
      throw err;
    }
  }, []);

  return {
    messages,
    connected,
    fetchMyMessages,
    createMessage,
    uploadMessage,
    getSecureMedia,
    joinChat,
    apiOrigin: MessagesAndMultimedia.getApiOrigin(),
  };
}
