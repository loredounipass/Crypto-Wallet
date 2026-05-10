import { useState, useRef } from 'react';
// Force Webpack recompile

export default function useP2PAudioRecorder(onSendAudio, onError) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        if (!mediaRecorderRef.current?.cancelRecording) {
          const mimeType = mediaRecorderRef.current.mimeType;
          let extension = 'webm';
          if (mimeType.includes('mp4')) extension = 'mp4';
          else if (mimeType.includes('ogg')) extension = 'ogg';
          else if (mimeType.includes('wav')) extension = 'wav';

          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const file = new File([audioBlob], `audio_${Date.now()}.${extension}`, { type: mimeType });
          onSendAudio(file);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      if (onError) onError('Permiso de micrófono denegado o no disponible.');
    }
  };

  const stopRecording = (cancel = false) => {
    if (mediaRecorderRef.current && isRecording) {
      if (cancel) {
        mediaRecorderRef.current.cancelRecording = true;
      } else {
        mediaRecorderRef.current.cancelRecording = false;
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording
  };
}
