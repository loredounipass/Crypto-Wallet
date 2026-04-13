import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send as SendIcon } from '../../ui/icons';

const ProviderChatComponent = () => {
  const currentUser = 'Yo';

  const chatList = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ];

  const [selectedChat, setSelectedChat] = useState(chatList[0]);

  const [messagesByChat, setMessagesByChat] = useState({});

  const [input, setInput] = useState('');

  const messagesEndRef = useRef(null);

  const messagesForSelected = useMemo(
    () => messagesByChat[selectedChat.id] || [],
    [messagesByChat, selectedChat.id]
  );

  const handleSend = () => {
    if (input.trim() !== '') {
      const newMessage = {
        text: input,
        timestamp: new Date(),
        sender: currentUser,
      };
      const prevMessages = messagesByChat[selectedChat.id] || [];
      setMessagesByChat({
        ...messagesByChat,
        [selectedChat.id]: [...prevMessages, newMessage],
      });
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesForSelected]);

  return (
    <div className="mx-auto flex h-[90vh] w-full max-w-[900px] rounded-xl border border-slate-200 bg-white shadow">
      <div className="w-[250px] overflow-y-auto border-r border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Chats</h2>
        <ul>
          {chatList.map((chat) => (
            <li
              key={chat.id}
              className={`mb-1 flex cursor-pointer items-center rounded-lg px-2 py-2 ${selectedChat.id === chat.id ? 'bg-blue-50' : 'hover:bg-slate-100'}`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-sm font-semibold text-slate-800">
                {chat.name.charAt(0)}
              </div>
              <span className="text-sm text-slate-800">{chat.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <h3 className="text-lg font-semibold text-slate-900">{selectedChat.name}</h3>
        </div>

        <div className="flex flex-1 flex-col justify-end overflow-y-auto bg-slate-50 p-4">
          <ul className="w-full">
            {messagesForSelected.map((msg, index) => (
              <li
                key={index}
                className={`flex py-1 ${msg.sender === currentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 ${msg.sender === currentUser ? 'bg-sky-600 text-white text-right' : 'bg-slate-200 text-slate-900 text-left'}`}
                >
                  {msg.sender !== currentUser && (
                    <p className="text-xs font-medium">
                      {msg.sender}
                    </p>
                  )}
                  <p className="text-sm">{msg.text}</p>
                  <span className="mt-1 block text-xs text-right opacity-80">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-200 p-3">
          <div className="flex h-10 items-center rounded-full border border-slate-300 bg-white px-2">
            <input
              className="w-full border-none bg-transparent px-2 text-sm outline-none"
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button
              type="button"
              onClick={handleSend}
              className="ml-1 inline-flex h-[35px] w-[35px] items-center justify-center rounded-full bg-sky-600 transition hover:bg-sky-700"
            >
              <SendIcon style={{ color: '#fff', fontSize: '20px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderChatComponent;
