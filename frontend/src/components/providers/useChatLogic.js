import { useState, useEffect, use, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../hooks/AuthContext';
import useMessagesAndMultimedia from '../../hooks/useMessagesAndMultimedia';
import { get } from '../../api/http';



// CUSTOM HOOK THAT MANAGES THE STATE AND LOGIC FOR THE PROVIDER CHAT COMPONENT
export default function useChatLogic() {
  const { t } = useTranslation();
  const [messageContent, setMessageContent] = useState('');
  const location = useLocation();
  const providerEmail = location.state?.providerEmail || null;
  
  const { messages: allMessages, fetchMyMessages, createMessage, uploadMessage, joinChat } = useMessagesAndMultimedia();
  const { auth } = use(AuthContext);
  
  const [isSending, setIsSending] = useState(false);
  const [localError, setLocalError] = useState('');
  const [counterpartId, setCounterpartId] = useState(null);
  const fileInputRef = useRef(null);



  // EFFECT TO FETCH THE COUNTERPART USER ID BY EMAIL AND JOIN THE CHAT
  useEffect(() => {
      if (!providerEmail || !auth?._id) return;

      const fetchCounterpart = async () => {
          try {
              const res = await get('/user/search', { q: providerEmail });
              const users = Array.isArray(res?.data?.data)
                  ? res.data.data
                  : (Array.isArray(res?.data) ? res.data : []);
              if (users.length > 0) {
                  const foundId = users[0]._id;
                  setCounterpartId(foundId);
                  setLocalError('');
                  joinChat(foundId);
                  fetchMyMessages();
              } else {
                  setLocalError(t('p2p_provider_not_found'));
              }
          } catch (err) {
              setLocalError(err.message);
          }
      };
      fetchCounterpart();
  }, [providerEmail, auth?._id, joinChat, fetchMyMessages, t]);



  // MEMOIZED LIST OF MESSAGES FILTERED FOR THIS SPECIFIC CONVERSATION AND SORTED CHRONOLOGICALLY
  const messages = useMemo(() => {
      if (!allMessages || !counterpartId || !auth?._id) return [];
      return allMessages
          .filter(m => 
              (m.sender === auth._id && m.receiver === counterpartId) ||
              (m.sender === counterpartId && m.receiver === auth._id)
          )
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [allMessages, counterpartId, auth?._id]);



  // HANDLES THE SUBMISSION OF A NEW MESSAGE, SUPPORTING BOTH TEXT AND MULTIMEDIA
  const handleSendMessage = async () => {
      if (!counterpartId || (!messageContent.trim() && !fileInputRef.current?.files[0]) || isSending) return;
      setIsSending(true);
      try {
          const file = fileInputRef.current?.files[0];
          const payload = {
              receiverId: counterpartId,
              content: messageContent,
              type: file ? 'image' : 'text',
          };

          if (file) {
              const uploaded = await uploadMessage(file, payload);
              if (!uploaded) throw new Error('uploadMessage failed');
              if (fileInputRef.current) fileInputRef.current.value = '';
          } else {
              const created = await createMessage(payload);
              if (!created) throw new Error('createMessage failed');
          }
          setMessageContent('');
          await fetchMyMessages();
      } catch (error) {
          setLocalError(error.message);
      } finally {
          setIsSending(false);
      }
  };

  return {
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
  };
}
