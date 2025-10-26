import React, { useState, useRef, useEffect } from 'react';
import './ACPSection.css';
import OpenAI from 'openai';

const ACPSection = ({ title, value, onChange, sectionType, apiKey }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const intentionallyCancelledRef = useRef(false);

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
      // Stop current speech - mark as intentional cancellation
      intentionallyCancelledRef.current = true;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsExplaining(false);
      return;
    }

    // Reset cancellation flag when starting new speech
    intentionallyCancelledRef.current = false;
    setIsExplaining(true);

    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      setIsExplaining(false);
      return;
    }

    // iOS Safari requires speechSynthesis.speak() to be called synchronously from user gesture
    // Start with a placeholder message immediately to maintain the user gesture context
    const placeholderUtterance = new SpeechSynthesisUtterance('Please wait, loading explanation...');
    placeholderUtterance.rate = 0.9;
    placeholderUtterance.pitch = 1;
    placeholderUtterance.volume = 1;

    // Track whether we have the real explanation ready
    let realExplanation = null;
    let explanationReady = false;

    placeholderUtterance.onstart = () => {
      setIsSpeaking(true);
      console.log('Placeholder speech started');
    };

    placeholderUtterance.onend = () => {
      console.log('Placeholder speech ended, explanationReady:', explanationReady);
      // When placeholder ends, speak the real explanation if it's ready
      if (explanationReady && realExplanation) {
        speakExplanation(realExplanation);
      }
    };

    placeholderUtterance.onerror = (event) => {
      console.error('Placeholder speech error:', event);
      setIsSpeaking(false);
      setIsExplaining(false);
      // Only show alert for actual errors, not intentional cancellations
      if (!intentionallyCancelledRef.current && event.error !== 'cancelled' && event.error !== 'interrupted') {
        alert('Failed to read the explanation aloud. Please check your browser settings.');
      }
    };

    // Speak placeholder immediately (synchronously) - critical for iOS
    window.speechSynthesis.speak(placeholderUtterance);

    // Helper function to speak the actual explanation
    const speakExplanation = (text) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('Real explanation speech started');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsExplaining(false);
        console.log('Real explanation speech ended');
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        setIsExplaining(false);
        // Only show alert for actual errors, not intentional cancellations
        if (!intentionallyCancelledRef.current && event.error !== 'cancelled' && event.error !== 'interrupted') {
          alert('Failed to read the explanation aloud. Please check your browser settings.');
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    // Now fetch the explanation asynchronously
    try {
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for browser use
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate healthcare assistant helping people complete their Advanced Care Planning Guide. Provide clear, empathetic, and practical explanations.'
          },
          {
            role: 'user',
            content: getExplainPrompt()
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      realExplanation = completion.choices[0].message.content;
      explanationReady = true;
      console.log('Explanation received from OpenAI');

      // If placeholder has already finished, speak the explanation now
      // Otherwise, the placeholder's onend will handle it
      if (!window.speechSynthesis.speaking) {
        console.log('Placeholder already finished, speaking explanation now');
        speakExplanation(realExplanation);
      } else {
        console.log('Placeholder still speaking, will speak explanation when it ends');
      }

    } catch (error) {
      console.error('Error getting explanation:', error);
      // Cancel any ongoing speech (this is intentional cleanup)
      intentionallyCancelledRef.current = true;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsExplaining(false);

      if (error.message.includes('API key')) {
        alert('Invalid API key. Please check your OpenAI API key and try again.');
      } else {
        alert('Failed to get explanation. Please try again.');
      }
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
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
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
