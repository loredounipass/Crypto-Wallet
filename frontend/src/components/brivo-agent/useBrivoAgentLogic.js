import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import useSupport from "../../hooks/useSupport";



// CUSTOM HOOK THAT MANAGES THE STATE AND INTERACTIONS FOR THE BRIVO AGENT CHATBOT
export default function useBrivoAgentLogic() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('brivoAgentDismissed') === 'true');
  const [mode, setMode] = useState(null);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const { messages, isLoading, isTyping, sendMessage, cancelResponse } = useSupport();



  // SCROLLS THE CHAT CONTAINER TO THE BOTTOM WHEN NEAR THE END
  const scrollToBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);



  // EFFECT TO SCROLL DOWN WHEN NEW MESSAGES ARRIVE
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);



  // TOGGLES THE CHAT WINDOW OPEN/CLOSED AND RESETS MODE ON CLOSE
  const toggleChat = useCallback(() => {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);
    if (!nextIsOpen) {
      setMode(null);
    } else {
      setTimeout(() => {
        scrollToBottom();
        if (mode === "agent") {
          inputRef.current?.focus();
        }
      }, 50);
    }
  }, [isOpen, mode, scrollToBottom]);



  // HANDLES THE MODE SELECTION (AGENT OR HUMAN) AND FOCUSES INPUT
  const handleModeSelect = useCallback((m) => {
    setMode(m);
    setTimeout(() => {
      scrollToBottom();
      if (m === "agent") {
        inputRef.current?.focus();
      }
    }, 50);
  }, [scrollToBottom]);



  // HANDLES SENDING A MESSAGE TO THE SUPPORT SERVICE
  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || isTyping) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
  }, [inputText, isLoading, isTyping, sendMessage]);



  // HANDLES ENTER KEY PRESS TO SUBMIT THE MESSAGE
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }, [handleSend]);



  // NAVIGATES BACK TO THE MODE SELECTION SCREEN
  const handleBack = useCallback(() => setMode(null), []);



  // DISMISSES THE BRIVO AGENT FAB AND PERSISTS THE CHOICE IN LOCALSTORAGE
  const handleDismiss = useCallback((e) => {
    e.stopPropagation();
    setIsOpen(false);
    setDismissed(true);
    localStorage.setItem('brivoAgentDismissed', 'true');
  }, []);

  return {
    t,
    isOpen,
    dismissed,
    mode,
    inputText,
    setInputText,
    messagesEndRef,
    chatContainerRef,
    inputRef,
    messages,
    isLoading,
    isTyping,
    cancelResponse,
    toggleChat,
    handleModeSelect,
    handleSend,
    handleKeyDown,
    handleBack,
    handleDismiss
  };
}
