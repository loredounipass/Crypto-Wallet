import { useState, useRef, useEffect } from 'react';



// CUSTOM HOOK THAT MANAGES THE STATE AND EVENT HANDLERS FOR THE CHAT INPUT AREA
export default function useP2PChatInputAreaLogic({ setMessageContent }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);



  // FORMATS THE RECORDING DURATION INTO MM:SS FORMAT
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };



  // EFFECT THAT LISTENS FOR CLICKS OUTSIDE THE EMOJI PICKER TO CLOSE IT
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);



  // APPENDS THE SELECTED EMOJI TO THE CURRENT MESSAGE CONTENT
  const onEmojiClick = (emojiObject) => {
    setMessageContent((prev) => prev + emojiObject.emoji);
  };

  return {
    showEmojiPicker,
    setShowEmojiPicker,
    emojiPickerRef,
    formatTime,
    onEmojiClick
  };
}
