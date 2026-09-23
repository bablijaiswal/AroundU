import { useEffect, useRef, useState } from 'react';
import './AroundUAssistant.css';

const createMessage = (sender, text, id = crypto.randomUUID()) => ({
  id,
  sender,
  text,
});

const quickPrompts = [
  'What is AroundU?',
  'How to find an event?',
  'How to post in Help Hub?',
  'How to connect with people?',
  'How to use bookmarks?',
  'What can I ask you about?',
];

const initialMessages = [
  createMessage(
    'assistant',
    "Hi there! 👋\nI'm the AroundU Assistant.\nI can help you with events, connecting with people, and local help."
  ),
];

const featureList = [
  { icon: '📅', label: 'Events', text: 'Finding, creating and viewing events', accent: 'peach' },
  { icon: '👥', label: 'Join / Connect', text: 'Connecting with people and groups', accent: 'blue' },
  { icon: '🤝', label: 'Help Hub', text: 'Asking for or offering local help', accent: 'green' },
  { icon: '💬', label: 'Messages', text: 'Sending and managing messages', accent: 'purple' },
  { icon: '🔔', label: 'Notifications', text: 'Understanding your notifications', accent: 'amber' },
  { icon: '🔖', label: 'Bookmarks', text: 'Saving useful posts and events', accent: 'orange' },
  { icon: '👤', label: 'Profile', text: 'Managing your profile', accent: 'lavender' },
];

export default function AroundUAssistant({ open, onClose }) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognition));

    if (!SpeechRecognition) {
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setDraft(transcript);
      }
    };

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
      setIsListening(false);
    };
  }, []);

  useEffect(() => () => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
    }
  }, []);

  if (!open) return null;

  const toggleListening = () => {
    if (!speechSupported) return;

    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      return;
    }

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const readAssistantMessage = (messageText) => {
    if (typeof window === 'undefined' || !messageText) return;

    const synthesis = window.speechSynthesis;
    if (!synthesis) return;

    if (synthesis.speaking || synthesis.paused) {
      synthesis.cancel();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(messageText);
    synthesis.speak(utterance);
  };

  const sendMessage = async (customMessage) => {
    const trimmed = (customMessage ?? draft).trim();

    if (!trimmed || isSending) return;

    const userMessage = createMessage('user', trimmed);
    const thinkingMessage = createMessage('assistant', 'Thinking...', crypto.randomUUID());

    setMessages((current) => [...current, userMessage, thinkingMessage]);
    setDraft('');
    setIsSending(true);

    try {
      const response = await fetch('http://localhost:5001/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to get a Gemini response');
      }

      setMessages((current) => {
        const filtered = current.filter((message) => message.id !== thinkingMessage.id);
        return [...filtered, createMessage('assistant', data.message)];
      });
    } catch (error) {
      setMessages((current) => {
        const filtered = current.filter((message) => message.id !== thinkingMessage.id);
        return [
          ...filtered,
          createMessage('assistant', 'Sorry, I could not reach the assistant right now. Please try again.'),
        ];
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="assistant-backdrop" onClick={onClose}>
      <div
        className="assistant-panel"
        role="dialog"
        aria-modal="true"
        aria-label="AroundU Assistant"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="assistant-main">
          <div className="assistant-header">
            <button type="button" className="assistant-back" onClick={onClose} aria-label="Back to previous screen">
              ←
            </button>
            <div className="assistant-header__title-wrap">
              <div className="assistant-header__title">AroundU Assistant</div>
              <div className="assistant-subtitle">Your guide to events, connections, and local help</div>
            </div>
          </div>

          <div className="assistant-chat" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`assistant-message-row ${message.sender === 'user' ? 'assistant-message-row--user' : ''}`}
              >
                {message.sender === 'assistant' && <div className="assistant-avatar">✦</div>}
                <div className={`assistant-message-stack ${message.sender === 'user' ? 'assistant-message-stack--user' : ''}`}>
                  <div className={`assistant-bubble ${message.sender === 'user' ? 'assistant-bubble--user' : 'assistant-bubble--assistant'}`}>
                    {message.text}
                  </div>
                  {message.sender === 'assistant' && (
                    <button
                      type="button"
                      className="assistant-speak"
                      onClick={() => readAssistantMessage(message.text)}
                      aria-label="Read assistant message aloud"
                    >
                      🔊
                    </button>
                  )}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="assistant-prompt-row">
                {quickPrompts.map((prompt) => (
                  <button key={prompt} type="button" className="assistant-prompt" onClick={() => sendMessage(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="assistant-input-wrap">
            <div className="assistant-input-icon">✦</div>
            <textarea
              className="assistant-input"
              rows={1}
              value={draft}
              placeholder="Ask something about AroundU..."
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className={`assistant-mic ${isListening ? 'assistant-mic--active' : ''}`}
              onClick={toggleListening}
              disabled={!speechSupported}
              aria-label={speechSupported ? 'Start voice input' : 'Voice input not supported in this browser'}
            >
              🎤
            </button>
            {isListening && <span className="assistant-listening">Listening...</span>}
            <button type="button" className="assistant-send" onClick={() => sendMessage()} disabled={isSending}>
              {isSending ? 'Sending...' : '➤'}
            </button>
          </div>
        </div>

        <aside className="assistant-side">
          <div className="assistant-side__top">
            <div className="assistant-side__robot">◔</div>
            <div className="assistant-side__speech">Ask anything<br />I'm here to help!</div>
          </div>

          <div className="assistant-side__card">
            {featureList.map((item) => (
              <div key={item.label} className={`assistant-side__item assistant-side__item--${item.accent}`}>
                <div className="assistant-side__icon">{item.icon}</div>
                <div className="assistant-side__text-wrap">
                  <div className="assistant-side__label">{item.label}</div>
                  <div className="assistant-side__text">{item.text}</div>
                </div>
                <div className="assistant-side__arrow">›</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
