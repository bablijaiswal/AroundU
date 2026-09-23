import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import MessagePreview from '../components/MessagePreview';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getInitials(name) {
  const safeName = name || 'Contact';
  return safeName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'C';
}

function getRelatedBadge(type) {
  return type === 'help_request' ? 'Related Request' : 'Related Post';
}

export default function MessagesPage() {
  const { user } = useAuth();
  const currentUser = user?.name || 'Anjali';
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState('list');
  const [conversationContext, setConversationContext] = useState(null);
  const endOfMessagesRef = useRef(null);
  const socketRef = useRef(null);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || threads[0] || null,
    [threads, activeThreadId]
  );

  useEffect(() => {
    const socket = io(socketUrl, { autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('chat:join', { user: currentUser });
    });

    socket.on('message:received', (payload) => {
      const sender = payload?.sender;
      const receiver = payload?.receiver;
      const text = payload?.text;
      const conversationId = payload?.conversationId;

      if (!sender || !receiver || !text || sender === currentUser) return;

      setThreads((prev) => {
        const existingIndex = prev.findIndex((thread) => thread.conversationId === conversationId || thread.user === sender);
        const nextMessage = {
          id: payload?._id || `${sender}-${Date.now()}`,
          sender,
          text,
          createdAt: payload?.createdAt || new Date().toISOString(),
        };

        if (existingIndex >= 0) {
          const nextThreads = [...prev];
          const existing = nextThreads[existingIndex];
          nextThreads[existingIndex] = {
            ...existing,
            preview: text,
            time: formatTime(nextMessage.createdAt),
            messages: [...(existing.messages || []), nextMessage],
          };
          return nextThreads.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        }

        return [
          {
            id: conversationId || `${sender}-${Date.now()}`,
            conversationId: conversationId || `${sender}-${Date.now()}`,
            user: sender,
            preview: text,
            time: formatTime(nextMessage.createdAt),
            unread: 1,
            messages: [nextMessage],
            relatedModel: payload?.relatedModel || null,
            relatedPost: payload?.relatedPost || null,
            conversationType: payload?.conversationType || 'join_connect',
          },
          ...prev,
        ];
      });
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    async function loadThreads() {
      try {
        const res = await api.get('/messages', { params: { user: currentUser } });
        const items = (res.data?.data || []).map((item) => {
          const otherUser = item.user || item.participants?.find((person) => person !== currentUser) || 'Contact';
          const messages = (item.messages || []).map((message) => ({
            id: message._id || `${message.sender}-${message.createdAt || Date.now()}`,
            sender: message.sender || currentUser,
            text: message.text || '',
            createdAt: message.createdAt || new Date().toISOString(),
          }));

          return {
            id: item.conversationId || item._id,
            conversationId: item.conversationId || item._id,
            user: otherUser,
            preview: item.preview || messages[messages.length - 1]?.text || 'No messages yet',
            time: formatTime(item.time || messages[messages.length - 1]?.createdAt),
            unread: item.unread || 0,
            messages,
            relatedModel: item.relatedModel,
            relatedPost: item.relatedPost,
            conversationType: item.conversationType,
          };
        });

        setThreads(items.sort((a, b) => (b.time || '').localeCompare(a.time || '')));
        if (items.length > 0) {
          setActiveThreadId(items[0].id);
          setMobileView('chat');
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoading(false);
      }
    }

    loadThreads();
  }, []);

  useEffect(() => {
    if (!activeThread) return;

    async function loadThread() {
      try {
        const userB = activeThread.user;
        const res = await api.get('/messages/conversation', {
          params: { userA: currentUser, userB },
        });

        const threadMessages = (res.data?.data?.messages || activeThread.messages || []).map((message) => ({
          id: message._id || `${message.sender}-${message.createdAt || Date.now()}`,
          sender: message.sender || currentUser,
          text: message.text || '',
          createdAt: message.createdAt || new Date().toISOString(),
        }));

        const latest = threadMessages[threadMessages.length - 1];

        setThreads((prev) => prev.map((thread) => {
          if (thread.id !== activeThread.id) return thread;
          return {
            ...thread,
            messages: threadMessages,
            preview: latest?.text || thread.preview || 'No messages yet',
            time: formatTime(latest?.createdAt || thread.time),
            unread: 0,
          };
        }));
      } catch (err) {
        console.error('Failed to load conversation history', err);
      }
    }

    loadThread();
  }, [activeThread?.id]);

  useEffect(() => {
    if (!activeThread) {
      setConversationContext(null);
      return;
    }

    async function loadContext() {
      if (!activeThread.conversationId) {
        setConversationContext(null);
        return;
      }

      try {
        const res = await api.get(`/conversations/${activeThread.conversationId}/context`);
        const reference = res.data?.data?.reference;
        const conversation = res.data?.data?.conversation;

        if (!reference) {
          setConversationContext(null);
          return;
        }

        setConversationContext({
          label: getRelatedBadge(conversation?.conversationType),
          title: reference.title || reference.description || 'Related item',
          subtitle: reference.location || reference.category || reference.type || '',
          route: conversation?.conversationType === 'help_request' ? `/help/${reference._id}` : `/posts/${reference._id}`,
        });
      } catch (err) {
        setConversationContext(null);
      }
    }

    loadContext();
  }, [activeThread?.conversationId]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeThread?.messages?.length, activeThreadId]);

  async function handleSendMessage() {
    if (!draft.trim() || !activeThread) return;

    const payload = {
      sender: currentUser,
      receiver: activeThread.user,
      text: draft.trim(),
      conversationId: activeThread.conversationId,
      relatedPost: activeThread.relatedPost || null,
      relatedModel: activeThread.relatedModel || null,
      conversationType: activeThread.conversationType || 'join_connect',
    };

    try {
      const res = await api.post('/messages', payload);
      const created = res.data?.data;
      const message = {
        id: created?._id || `${currentUser}-${Date.now()}`,
        sender: currentUser,
        text: draft.trim(),
        createdAt: created?.createdAt || new Date().toISOString(),
      };

      setThreads((prev) => prev.map((thread) => {
        if (thread.id !== activeThread.id) return thread;
        const messages = [...(thread.messages || []), message];
        const latest = messages[messages.length - 1];
        return {
          ...thread,
          preview: message.text,
          time: formatTime(latest.createdAt),
          messages,
        };
      }));

      setDraft('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  }

  function handleSelectThread(thread) {
    setActiveThreadId(thread.id);
    setMobileView('chat');
  }

  const activeMessages = activeThread?.messages || [];

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow color-brown">Messages</p>
          <h1>Conversations</h1>
        </div>
      </div>

      <div className={`messenger-shell ${mobileView === 'chat' ? 'mobile-chat-open' : ''}`}>
        <aside className="conversation-panel">
          <div className="messages-panel-header">
            <h2>Chats</h2>
          </div>

          {loading ? (
            <div className="empty-state compact"><p>Loading conversations…</p></div>
          ) : threads.length === 0 ? (
            <div className="empty-state compact"><p>No conversations yet.</p></div>
          ) : (
            <div className="conversation-list">
              {threads.map((thread) => (
                <button
                  type="button"
                  key={thread.id}
                  className={`conversation-item ${activeThread?.id === thread.id ? 'active' : ''}`}
                  onClick={() => handleSelectThread(thread)}
                >
                  <span className="avatar avatar-md">{getInitials(thread.user)}</span>
                  <span className="conversation-item__content">
                    <span className="conversation-item__head">
                      <strong>{thread.user || 'Contact'}</strong>
                      <small>{thread.time || 'now'}</small>
                    </span>
                    <span className="conversation-item__meta">
                      <span>{thread.preview || 'No messages yet'}</span>
                      {thread.unread > 0 && <span className="unread-badge">{thread.unread}</span>}
                    </span>
                    {thread.relatedPost && (
                      <small className="conversation-item__context">{getRelatedBadge(thread.conversationType)}</small>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="chat-panel">
          {!activeThread ? (
            <div className="empty-state large"><p>Select a conversation to begin chatting.</p></div>
          ) : (
            <>
              <div className="chat-header">
                <button
                  type="button"
                  className="chat-header__back"
                  onClick={() => setMobileView('list')}
                >
                  ← Back
                </button>

                <div className="chat-header__identity">
                  <span className="avatar avatar-md">{getInitials(activeThread.user)}</span>
                  <div>
                    <strong>{activeThread.user || 'Contact'}</strong>
                    <small>
                      <span className="chat-online-dot" /> Online
                    </small>
                  </div>
                </div>
              </div>

              {conversationContext && (
                <div className="chat-context-card">
                  <div className="chat-context-card__content">
                    <span className="chat-context-card__label">{conversationContext.label}</span>
                    <strong>{conversationContext.title}</strong>
                    {conversationContext.subtitle && <small>{conversationContext.subtitle}</small>}
                  </div>
                  <a href={conversationContext.route} className="chip-link">View</a>
                </div>
              )}

              <div className="chat-body">
                {activeMessages.length === 0 ? (
                  <div className="empty-state compact"><p>No messages yet. Say hello.</p></div>
                ) : (
                  activeMessages.map((message) => {
                    const isMine = message.sender === currentUser;
                    return (
                      <div key={message.id} className={`chat-bubble-wrap ${isMine ? 'mine' : 'their'}`}>
                        <div className={`chat-bubble ${isMine ? 'mine' : 'their'}`}>
                          <p>{message.text}</p>
                          <small>{formatTime(message.createdAt)}</small>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endOfMessagesRef} />
              </div>

              <div className="chat-composer">
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                />
                <button type="button" onClick={handleSendMessage}>Send</button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
