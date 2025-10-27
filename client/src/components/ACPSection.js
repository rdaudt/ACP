import React, { useState, useRef, useEffect } from 'react';
import './ACPSection.css';
import OpenAI from 'openai';

const ACPSection = ({ title, value, onChange, sectionType, apiKey }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

          // Transcribe audio
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
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      // Create a File object from the blob
      const audioFile = new File([audioBlob], 'recording.webm', { type: audioBlob.type });

      // Transcribe using Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en'
      });

      const transcript = transcription.text;
      onChange(transcript);

    } catch (error) {
      console.error('Error transcribing audio:', error);
      if (error.message.includes('API key')) {
        alert('Invalid API key. Please check your OpenAI API key and try again.');
      } else {
        alert('Failed to transcribe audio. Please try again.');
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const MAX_CHARS = 1262;
  const remainingChars = MAX_CHARS - value.length;
  const isOverLimit = value.length > MAX_CHARS;

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

      <div className="char-counter" style={{
        color: isOverLimit ? '#d32f2f' : '#666',
        fontWeight: isOverLimit ? 'bold' : 'normal',
        marginTop: '5px',
        fontSize: '14px'
      }}>
        {isOverLimit ? (
          <span>⚠️ Over limit by {Math.abs(remainingChars)} characters</span>
        ) : (
          <span>{value.length} / {MAX_CHARS} characters ({remainingChars} remaining)</span>
        )}
      </div>

      <div className="button-group">
        <button
          className={`action-button record-button ${isRecording ? 'recording' : ''}`}
          onClick={handleRecord}
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
