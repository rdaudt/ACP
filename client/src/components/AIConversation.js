import React, { useState, useRef, useEffect } from 'react';
import './AIConversation.css';
import OpenAI from 'openai';

const AIConversation = ({ apiKey, beliefs, values, wishes }) => {
  // Conversation states
  const STATES = {
    IDLE: 'idle',
    INITIALIZING: 'initializing',
    AI_SPEAKING: 'ai_speaking',
    READY: 'ready',
    USER_SPEAKING: 'user_speaking',
    PROCESSING: 'processing',
    ERROR: 'error'
  };

  // State management
  const [conversationState, setConversationState] = useState(STATES.IDLE);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [aiCurrentMessage, setAiCurrentMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Refs for speech APIs
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const intentionallyCancelledRef = useRef(false);
  const streamRef = useRef(null);

  // Detect iOS
  const isIOS = () => {
    return /iPhone|iPad|iPod/.test(navigator.userAgent);
  };

  // Check for Web Speech API support
  const isSpeechRecognitionSupported = () => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  };

  // Initialize iOS speech synthesis context
  const initializeIOSContext = () => {
    if (isIOS()) {
      const init = new SpeechSynthesisUtterance('');
      init.volume = 0;
      window.speechSynthesis.speak(init);
      window.speechSynthesis.cancel();
    }
  };

  // Get system prompt with current context
  const getSystemPrompt = () => {
    return `You are a warm, empathetic healthcare conversation partner helping someone think through their Advanced Care Planning Guide for British Columbia.

Your purpose is to have a natural, flowing conversation that helps them:
1. Discover and articulate their personal beliefs (what gives life meaning)
2. Identify their core values (what they care deeply about)
3. Express their wishes for future healthcare, life support, and medical interventions

CONVERSATION STYLE:
- Speak naturally as if having a caring conversation
- Keep responses to 2-4 sentences (they will be read aloud)
- Ask thoughtful, open-ended questions
- Listen deeply and reflect back what you hear
- Gently probe for deeper understanding when appropriate
- Be comfortable with silence - don't rush
- Show genuine curiosity about their unique perspective

CONTEXT AWARENESS:
Current content they've written:
- Beliefs: ${beliefs || "Not yet filled in"}
- Values: ${values || "Not yet filled in"}
- Wishes: ${wishes || "Not yet filled in"}

You can reference what they've already written and help them expand, clarify, or feel confident about their choices.

IMPORTANT:
- This is sensitive, personal healthcare planning
- Honor their autonomy and decisions
- Never judge or prescribe what they should value
- If they seem uncertain, help them explore, don't push
- Be concise since responses are spoken aloud
- If the user says goodbye, end with a brief, warm farewell

Begin by warmly greeting them and asking what they'd like to explore first.`;
  };

  // Speak AI message using SpeechSynthesis
  const speakAIMessage = (message) => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Reset cancellation flag
      intentionallyCancelledRef.current = false;

      // For iOS, create and speak placeholder first
      if (isIOS()) {
        const placeholder = new SpeechSynthesisUtterance('');
        placeholder.volume = 0.01;
        placeholder.rate = 10;

        placeholder.onend = () => {
          speakActualMessage(message, resolve, reject);
        };

        placeholder.onerror = (event) => {
          console.error('Placeholder error:', event);
          speakActualMessage(message, resolve, reject);
        };

        window.speechSynthesis.speak(placeholder);
      } else {
        speakActualMessage(message, resolve, reject);
      }
    });
  };

  const speakActualMessage = (message, resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to use a better quality voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice =>
      voice.lang.startsWith('en') && (voice.name.includes('Enhanced') || voice.name.includes('Premium'))
    ) || voices.find(voice => voice.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      console.log('AI speech started');
    };

    utterance.onend = () => {
      console.log('AI speech ended');
      resolve();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      if (!intentionallyCancelledRef.current && event.error !== 'cancelled' && event.error !== 'interrupted') {
        reject(new Error('Speech synthesis failed'));
      } else {
        resolve(); // Treat cancellation as normal completion
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Stop AI speaking
  const stopAISpeaking = () => {
    if (window.speechSynthesis.speaking) {
      intentionallyCancelledRef.current = true;
      window.speechSynthesis.cancel();
    }
  };

  // Get AI response from GPT-4o
  const getAIResponse = async (userMessage) => {
    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      // Add user message to history
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      // Build messages array with system prompt
      const messages = [
        { role: 'system', content: getSystemPrompt() },
        ...updatedHistory
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.8,
        max_tokens: 300,
        presence_penalty: 0.3,
        frequency_penalty: 0.3
      });

      const aiResponse = completion.choices[0].message.content;

      // Update conversation history
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: aiResponse }
      ]);

      return aiResponse;

    } catch (error) {
      console.error('Error getting AI response:', error);
      throw error;
    }
  };

  // Initialize Web Speech Recognition
  const initializeWebSpeech = () => {
    if (!isSpeechRecognitionSupported()) {
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      finalTranscript = '';
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setLiveTranscript(finalTranscript + interimTranscript);

      // Reset silence timer on new speech
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Set new silence timer (2 seconds of silence = done speaking)
      silenceTimerRef.current = setTimeout(() => {
        if (conversationState === STATES.USER_SPEAKING) {
          console.log('Silence detected, stopping recording');
          stopUserSpeaking();
        }
      }, 2000);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setErrorMessage('Speech recognition error. Please try again.');
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
    };

    recognitionRef.current = recognition;
    return recognition;
  };

  // Initialize MediaRecorder for Whisper backup
  const initializeMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const options = MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : {};

      const mediaRecorder = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      return mediaRecorder;

    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw new Error('Failed to access microphone. Please ensure you have granted permission.');
    }
  };

  // Transcribe audio with Whisper
  const transcribeWithWhisper = async (audioBlob) => {
    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      const audioFile = new File([audioBlob], 'recording.webm', { type: audioBlob.type });

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en'
      });

      return transcription.text;

    } catch (error) {
      console.error('Error transcribing with Whisper:', error);
      return null; // Return null on error, will use Web Speech result
    }
  };

  // Start conversation
  const startConversation = async () => {
    try {
      setConversationState(STATES.INITIALIZING);
      setErrorMessage('');
      setConversationHistory([]);

      // Initialize iOS context
      initializeIOSContext();

      // Get AI greeting
      const greeting = await getAIResponse("Hello, I'd like to talk about my advanced care planning.");

      // Speak greeting
      setAiCurrentMessage(greeting);
      setConversationState(STATES.AI_SPEAKING);

      await speakAIMessage(greeting);

      // Move to ready state
      setConversationState(STATES.READY);
      setAiCurrentMessage('');

    } catch (error) {
      console.error('Error starting conversation:', error);
      setErrorMessage('Failed to start conversation. Please check your API key and try again.');
      setConversationState(STATES.ERROR);
    }
  };

  // Start user speaking
  const startUserSpeaking = async () => {
    try {
      setConversationState(STATES.USER_SPEAKING);
      setLiveTranscript('');
      setErrorMessage('');

      // Initialize Web Speech Recognition
      const recognition = initializeWebSpeech();
      if (recognition) {
        recognition.start();
      }

      // Initialize MediaRecorder for Whisper backup
      const mediaRecorder = await initializeMediaRecorder();
      mediaRecorder.start();

    } catch (error) {
      console.error('Error starting recording:', error);
      setErrorMessage(error.message || 'Failed to start recording. Please try again.');
      setConversationState(STATES.READY);
    }
  };

  // Stop user speaking
  const stopUserSpeaking = async () => {
    try {
      setConversationState(STATES.PROCESSING);

      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      // Stop Web Speech Recognition
      let webSpeechTranscript = liveTranscript.trim();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      // Stop MediaRecorder
      let audioBlob = null;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        await new Promise((resolve) => {
          mediaRecorderRef.current.onstop = () => {
            audioBlob = new Blob(audioChunksRef.current, {
              type: mediaRecorderRef.current.mimeType
            });
            resolve();
          };
          mediaRecorderRef.current.stop();
        });
      }

      // Stop audio stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // If we got no transcript, return to ready state
      if (!webSpeechTranscript && !audioBlob) {
        setErrorMessage('No speech detected. Please try again.');
        setConversationState(STATES.READY);
        return;
      }

      // Try to get Whisper transcription as backup/enhancement
      let whisperTranscript = null;
      if (audioBlob) {
        whisperTranscript = await transcribeWithWhisper(audioBlob);
      }

      // Use best transcription (prefer Whisper if available and significantly different)
      const finalTranscript = whisperTranscript || webSpeechTranscript;

      if (!finalTranscript || finalTranscript.trim().length === 0) {
        setErrorMessage('No speech detected. Please try again.');
        setConversationState(STATES.READY);
        return;
      }

      console.log('Final transcript:', finalTranscript);

      // Check if user wants to end conversation
      const endPhrases = ['goodbye', 'bye', 'end conversation', 'stop', 'that\'s all', 'thank you goodbye'];
      const lowerTranscript = finalTranscript.toLowerCase();
      const wantsToEnd = endPhrases.some(phrase => lowerTranscript.includes(phrase));

      if (wantsToEnd) {
        // Get farewell from AI
        const farewell = await getAIResponse(finalTranscript);
        setAiCurrentMessage(farewell);
        setConversationState(STATES.AI_SPEAKING);
        await speakAIMessage(farewell);

        // End conversation
        endConversation();
        return;
      }

      // Get AI response
      const aiResponse = await getAIResponse(finalTranscript);

      // Speak AI response
      setAiCurrentMessage(aiResponse);
      setConversationState(STATES.AI_SPEAKING);
      setLiveTranscript('');

      await speakAIMessage(aiResponse);

      // Move back to ready state
      setConversationState(STATES.READY);
      setAiCurrentMessage('');

    } catch (error) {
      console.error('Error processing speech:', error);
      setErrorMessage('Failed to process your speech. Please try again.');
      setConversationState(STATES.READY);
      setLiveTranscript('');
    }
  };

  // Skip AI speaking
  const skipAISpeaking = () => {
    stopAISpeaking();
    setConversationState(STATES.READY);
    setAiCurrentMessage('');
  };

  // End conversation
  const endConversation = () => {
    // Stop all ongoing activities
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    stopAISpeaking();

    // Reset state
    setConversationState(STATES.IDLE);
    setLiveTranscript('');
    setAiCurrentMessage('');
    setErrorMessage('');
  };

  // Main button handler
  const handleMainButton = () => {
    switch (conversationState) {
      case STATES.IDLE:
        startConversation();
        break;
      case STATES.READY:
        startUserSpeaking();
        break;
      case STATES.USER_SPEAKING:
        stopUserSpeaking();
        break;
      case STATES.AI_SPEAKING:
        skipAISpeaking();
        break;
      default:
        break;
    }
  };

  // Get button label based on state
  const getButtonLabel = () => {
    switch (conversationState) {
      case STATES.IDLE:
        return 'Talk to AI about beliefs, values and wishes';
      case STATES.INITIALIZING:
        return 'Starting conversation...';
      case STATES.AI_SPEAKING:
        return 'AI is speaking... (click to skip)';
      case STATES.READY:
        return 'Click to Speak';
      case STATES.USER_SPEAKING:
        return 'I\'m listening... (click when done)';
      case STATES.PROCESSING:
        return 'Thinking...';
      case STATES.ERROR:
        return 'Try Again';
      default:
        return 'Talk to AI';
    }
  };

  // Get button class based on state
  const getButtonClass = () => {
    return `main-button ${conversationState}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup function - stop all activities
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (window.speechSynthesis.speaking) {
        intentionallyCancelledRef.current = true;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Load voices when available
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Load voices
      window.speechSynthesis.getVoices();

      // Some browsers require listening to voiceschanged event
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  return (
    <div className="ai-conversation-container">
      {conversationState === STATES.IDLE && (
        <div className="conversation-idle">
          <button
            onClick={handleMainButton}
            className="start-button"
          >
            {getButtonLabel()}
          </button>
        </div>
      )}

      {conversationState !== STATES.IDLE && (
        <div className="conversation-active">
          <div className="conversation-status">
            <div className={`status-visualizer ${conversationState}`}>
              {conversationState === STATES.AI_SPEAKING && (
                <div className="sound-wave">
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                </div>
              )}
              {conversationState === STATES.USER_SPEAKING && (
                <div className="microphone-indicator">
                  <div className="mic-icon">🎤</div>
                  <div className="pulse-ring"></div>
                </div>
              )}
              {conversationState === STATES.PROCESSING && (
                <div className="thinking-indicator">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              )}
              {conversationState === STATES.READY && (
                <div className="ready-indicator">
                  <div className="ready-icon">✓</div>
                </div>
              )}
              {conversationState === STATES.INITIALIZING && (
                <div className="initializing-indicator">
                  <div className="spinner"></div>
                </div>
              )}
            </div>
          </div>

          {liveTranscript && (
            <div className="live-transcript">
              <div className="transcript-label">You're saying:</div>
              <div className="transcript-text">{liveTranscript}</div>
            </div>
          )}

          {aiCurrentMessage && (
            <div className="ai-message">
              <div className="message-label">AI:</div>
              <div className="message-text">{aiCurrentMessage}</div>
            </div>
          )}

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          <div className="conversation-controls">
            <button
              onClick={handleMainButton}
              className={getButtonClass()}
              disabled={conversationState === STATES.PROCESSING || conversationState === STATES.INITIALIZING}
            >
              {getButtonLabel()}
            </button>

            {conversationState !== STATES.INITIALIZING && (
              <button
                onClick={endConversation}
                className="end-button"
              >
                End Conversation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConversation;
