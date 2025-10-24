import React, { useState, useRef, useEffect } from 'react';
import './ACPSection.css';
import axios from 'axios';

const ACPSection = ({ title, value, onChange, sectionType }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const speechSynthesisRef = useRef(null);

  // Get appropriate prompts for each section type
  const getExplainPrompt = () => {
    const prompts = {
      beliefs: `Please provide a clear and compassionate explanation of what "personal beliefs" means in the context of preparing an Advanced Care Planning Guide in British Columbia. Include 3-4 practical examples of personal beliefs that people might include in their advance care plan. Keep the explanation concise and easy to understand.`,
      values: `Please provide a clear and compassionate explanation of what "personal values" means in the context of preparing an Advanced Care Planning Guide in British Columbia. Include 3-4 practical examples of personal values that people might include in their advance care plan. Keep the explanation concise and easy to understand.`,
      wishes: `Please provide a clear and compassionate explanation of what "wishes for future health care treatment, life support and life-prolonging medical interventions" means in the context of preparing an Advanced Care Planning Guide in British Columbia. Include 3-4 practical examples of wishes that people might include in their advance care plan. Keep the explanation concise and easy to understand.`
    };
    return prompts[sectionType];
  };

  const handleExplain = async () => {
    if (isSpeaking) {
      // Stop current speech
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsExplaining(false);
      return;
    }

    setIsExplaining(true);

    try {
      const response = await axios.post('/api/explain', {
        prompt: getExplainPrompt(),
        sectionType
      });

      const explanation = response.data.explanation;

      // Use Web Speech API to read the explanation aloud
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(explanation);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setIsExplaining(false);
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setIsSpeaking(false);
          setIsExplaining(false);
          alert('Failed to read the explanation aloud. Please check your browser settings.');
        };

        window.speechSynthesis.speak(utterance);
      } else {
        alert('Text-to-speech is not supported in your browser.');
        setIsExplaining(false);
      }

    } catch (error) {
      console.error('Error getting explanation:', error);
      alert('Failed to get explanation. Please try again.');
      setIsExplaining(false);
    }
  };

  const handleRecord = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Check for browser support
        const options = MediaRecorder.isTypeSupported('audio/webm')
          ? { mimeType: 'audio/webm' }
          : {};

        mediaRecorderRef.current = new MediaRecorder(stream, options);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorderRef.current.mimeType
          });

          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());

          // Send audio to backend for transcription
          await transcribeAudio(audioBlob);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);

      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Failed to access microphone. Please ensure you have granted permission.');
      }
    } else {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('sectionType', sectionType);

      const response = await axios.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const transcript = response.data.transcript;
      onChange(transcript);

    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Failed to transcribe audio. Please try again.');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="acp-section">
      <label className="section-label">{title}</label>

      <textarea
        className="section-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter your ${sectionType} here or use the Record button to dictate...`}
        rows={6}
      />

      <div className="button-group">
        <button
          className={`action-button explain-button ${isSpeaking ? 'speaking' : ''}`}
          onClick={handleExplain}
          disabled={isRecording}
        >
          {isSpeaking ? 'Stop Speaking' : 'Explain'}
        </button>

        <button
          className={`action-button record-button ${isRecording ? 'recording' : ''}`}
          onClick={handleRecord}
          disabled={isExplaining || isSpeaking}
        >
          {isRecording ? 'Stop Recording' : 'Record'}
        </button>
      </div>

      {isRecording && (
        <div className="recording-indicator">
          <span className="recording-dot"></span>
          Recording in progress... Click "Stop Recording" when done.
        </div>
      )}
    </div>
  );
};

export default ACPSection;
