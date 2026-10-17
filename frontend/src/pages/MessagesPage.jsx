import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';
import api from '../services/api';
import socket, { identifySocketUser } from '../services/socket';
import { useAuth } from '../context/AuthContext';

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getRelatedBadge(type) {
  return type === 'help_request' ? 'Related Request' : 'Related Post';
}

function getMessageId(message, fallbackPrefix = '') {
  return message?._id || message?.id || `${fallbackPrefix}-${message?.createdAt || Date.now()}`;
}

function mapBackendMessage(message) {
  return {
    id: getMessageId(message, message?.senderId || message?.sender || 'msg'),
    senderId: message?.senderId || '',
    receiverId: message?.receiverId || '',
    senderName: message?.senderName || message?.sender || '',
    receiverName: message?.receiverName || message?.receiver || '',
    sender: message?.senderName || message?.sender || '',
    receiver: message?.receiverName || message?.receiver || '',
    text: message?.text || '',
    createdAt: message?.createdAt || new Date().toISOString(),
  };
}

function mapThreadFromApi(item) {
  const messages = (item.messages || []).map(mapBackendMessage);
  const latest = messages[messages.length - 1];
  const userName = item.userName || item.user || item.participantName || 'Contact';

  return {
    id: String(item.conversationId || item._id),
    conversationId: String(item.conversationId || item._id),
    userId: item.userId || item.participantId || '',
    userName,
    user: userName,
    userAvatar: item.userAvatar || '',
    preview: item.preview || latest?.text || 'No messages yet',
    time: formatTime(item.time || latest?.createdAt || item.lastMessageAt),
    lastMessageAt: latest?.createdAt || item.lastMessageAt || item.updatedAt || item.createdAt,
    unread: item.unread || 0,
    messages,
    relatedModel: item.relatedModel || null,
    relatedPost: item.relatedPost || null,
    conversationType: item.conversationType || 'join_connect',
  };
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const currentUserId = user?.id || user?.uid || '';
  const currentUserUid = user?.firebaseUid || user?.uid || '';
  const currentUserName = user?.name || user?.displayName || 'AroundU User';
  const conversationIdFromQuery = searchParams.get('conversationId') || '';

  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [mobileView, setMobileView] = useState('list');
  const [conversationContext, setConversationContext] = useState(null);
  const endOfMessagesRef = useRef(null);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || threads[0] || null,
    [threads, activeThreadId]
  );

  // Identify user with socket and join their rooms
  useEffect(() => {
    if (!user) return;
    identifySocketUser(user);
  }, [user]);

  // Setup Socket listeners
  useEffect(() => {
    if (!currentUserId) return undefined;

    const handleConnect = () => {
      identifySocketUser(user);
      for (const thread of threads) {
        if (thread.conversationId) {
          socket.emit('conversation:join', { conversationId: thread.conversationId });
        }
      }
    };

    const handleIncomingMessage = (payload) => {
      const conversationId = String(payload?.conversationId || '');
      const text = payload?.text;
      const senderId = String(payload?.senderId || payload?.sender || '');
      const receiverId = String(payload?.receiverId || payload?.receiver || '');

      if (!conversationId || !text) return;

      const messageId = getMessageId(payload, conversationId);
      const createdAt = payload?.createdAt || new Date().toISOString();
      const nextMessage = {
        id: messageId,
        senderId,
        receiverId,
        senderName: payload?.senderName || payload?.sender || '',
        receiverName: payload?.receiverName || payload?.receiver || '',
        sender: payload?.senderName || payload?.sender || '',
        receiver: payload?.receiverName || payload?.receiver || '',
        text,
        createdAt,
      };

      setThreads((prev) => {
        const existingIndex = prev.findIndex((thread) => String(thread.conversationId) === conversationId);
        const myIds = [String(currentUserId), String(currentUserUid)].filter(Boolean);
        const isMine = myIds.includes(senderId);
        const otherUserId = isMine ? receiverId : senderId;
        const otherUserName = isMine
          ? (payload?.receiverName || payload?.receiver || 'Contact')
          : (payload?.senderName || payload?.sender || 'Contact');

        if (existingIndex >= 0) {
          const nextThreads = [...prev];
          const existing = nextThreads[existingIndex];
          if ((existing.messages || []).some((m) => m.id === messageId)) {
            return prev;
          }

          const messages = [...(existing.messages || []), nextMessage];
          const isActive = String(existing.id) === String(activeThreadId);

          nextThreads[existingIndex] = {
            ...existing,
            userId: existing.userId || otherUserId,
            userName: existing.userName || otherUserName,
            user: existing.user || otherUserName,
            preview: text,
            time: formatTime(createdAt),
            lastMessageAt: createdAt,
            unread: isActive || isMine ? 0 : (existing.unread || 0) + 1,
            messages,
          };

          return [...nextThreads].sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
        }

        // New conversation received in real-time
        socket.emit('conversation:join', { conversationId });

        const newThread = {
          id: conversationId,
          conversationId,
          userId: otherUserId,
          userName: otherUserName,
          user: otherUserName,
          preview: text,
          time: formatTime(createdAt),
          lastMessageAt: createdAt,
          unread: isMine ? 0 : 1,
          messages: [nextMessage],
          relatedModel: payload?.relatedModel || null,
          relatedPost: payload?.relatedPost || null,
          conversationType: payload?.conversationType || 'join_connect',
        };

        return [newThread, ...prev].sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      });
    };

    socket.on('connect', handleConnect);
    socket.on('message:new', handleIncomingMessage);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('message:new', handleIncomingMessage);
    };
  }, [currentUserId, currentUserUid, user, threads, activeThreadId]);

  // Load threads on mount / user change
  useEffect(() => {
    async function loadThreads() {
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/messages', { params: { user: currentUserId } });
        let items = (res.data?.data || []).map(mapThreadFromApi);
        let sorted = items.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));

        // If conversationIdFromQuery is present but not in the returned list, fetch it specifically
        if (conversationIdFromQuery && !sorted.some((t) => String(t.conversationId) === String(conversationIdFromQuery))) {
          try {
            const singleRes = await api.get(`/conversations/${conversationIdFromQuery}`);
            if (singleRes.data?.data) {
              const fetchedThread = mapThreadFromApi(singleRes.data.data);
              sorted = [fetchedThread, ...sorted];
            }
          } catch (e) {
            console.warn('Unable to load requested conversation context directly', e);
          }
        }

        setThreads(sorted);

        const selectedThread = conversationIdFromQuery
          ? sorted.find((thread) => String(thread.conversationId) === String(conversationIdFromQuery))
          : sorted[0];

        if (selectedThread) {
          setActiveThreadId(selectedThread.id);
          setMobileView('chat');
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoading(false);
      }
    }

    loadThreads();
  }, [conversationIdFromQuery, currentUserId]);

  // Join rooms for all current threads
  useEffect(() => {
    if (!currentUserId || !threads.length) return;

    threads.forEach((thread) => {
      if (thread.conversationId) {
        socket.emit('conversation:join', { conversationId: thread.conversationId });
      }
    });
  }, [currentUserId, threads]);

  // Fetch full conversation history when active thread changes
  useEffect(() => {
    if (!activeThread?.conversationId || !currentUserId) return;

    async function loadThread() {
      try {
        const res = await api.get(`/conversations/${activeThread.conversationId}`);
        const threadMessages = (res.data?.data?.messages || activeThread.messages || []).map(mapBackendMessage);
        const latest = threadMessages[threadMessages.length - 1];

        setThreads((prev) => prev.map((thread) => {
          if (thread.id !== activeThread.id) return thread;
          return {
            ...thread,
            messages: threadMessages,
            preview: latest?.text || thread.preview || 'No messages yet',
            time: formatTime(latest?.createdAt || thread.time),
            lastMessageAt: latest?.createdAt || thread.lastMessageAt || thread.updatedAt,
            unread: 0,
          };
        }));
      } catch (err) {
        console.error('Failed to load conversation history', err);
      }
    }

    loadThread();
  }, [activeThread?.conversationId, currentUserId]);

  // Load related context card (post or help request)
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

  // Scroll to bottom on new message
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeThread?.messages?.length, activeThreadId]);

  async function handleSendMessage() {
    const textToSend = draft.trim();
    if (!textToSend || !activeThread || !currentUserId) return;

    setSending(true);
    setSendError('');

    const payload = {
      receiverId: activeThread.userId || '',
      text: textToSend,
      conversationId: activeThread.conversationId,
      relatedPost: activeThread.relatedPost || null,
      relatedModel: activeThread.relatedModel || null,
      conversationType: activeThread.conversationType || 'join_connect',
    };

    try {
      const res = await api.post('/messages', payload);
      const created = res.data?.data;
      const messageId = created?._id || created?.id || `${currentUserId}-${Date.now()}`;
      const createdAt = created?.createdAt || new Date().toISOString();

      const message = {
        id: messageId,
        senderId: currentUserId,
        receiverId: activeThread.userId,
        senderName: currentUserName,
        receiverName: activeThread.userName || activeThread.user,
        sender: currentUserName,
        receiver: activeThread.userName || activeThread.user,
        text: textToSend,
        createdAt,
      };

      setThreads((prev) => prev.map((thread) => {
        if (thread.id !== activeThread.id) return thread;
        if ((thread.messages || []).some((item) => item.id === messageId)) return thread;

        const messages = [...(thread.messages || []), message];
        const latest = messages[messages.length - 1];
        return {
          ...thread,
          preview: message.text,
          time: formatTime(latest.createdAt),
          lastMessageAt: latest.createdAt,
          messages,
        };
      }));

      setDraft('');
    } catch (err) {
      console.error('Failed to send message', err);
      const msg = err.response?.data?.message || 'Failed to send message. Please try again.';
      setSendError(msg);
    } finally {
      setSending(false);
    }
  }

  function handleSelectThread(thread) {
    setActiveThreadId(thread.id);
    setMobileView('chat');
    setSendError('');
    // Clear unread
    setThreads((prev) => prev.map((t) => (t.id === thread.id ? { ...t, unread: 0 } : t)));
  }

  const activeMessages = activeThread?.messages || [];
  const myIds = [String(currentUserId), String(currentUserUid)].filter(Boolean);
  const myNames = [String(currentUserName).toLowerCase(), String(user?.displayName || '').toLowerCase()].filter(Boolean);

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
                  <UserAvatar
                    user={{ name: thread.userName || thread.user, profileImage: thread.userAvatar }}
                    size="md"
                  />
                  <span className="conversation-item__content">
                    <span className="conversation-item__head">
                      <strong>{thread.userName || thread.user || 'Contact'}</strong>
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
                  <UserAvatar
                    user={{ name: activeThread.userName || activeThread.user, profileImage: activeThread.userAvatar }}
                    size="md"
                  />
                  <div>
                    <strong>{activeThread.userName || activeThread.user || 'Contact'}</strong>
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
                    const senderMatch = message.senderId && myIds.includes(String(message.senderId));
                    const nameMatch = message.sender && myNames.includes(String(message.sender).toLowerCase());
                    const isMine = Boolean(senderMatch || nameMatch);

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

              {sendError && (
                <div style={{ padding: '0.5rem 1rem', background: '#ffebee', color: '#c62828', fontSize: '0.85rem' }}>
                  {sendError}
                </div>
              )}

              <div className="chat-composer">
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (sendError) setSendError('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  disabled={sending}
                />
                <button type="button" onClick={handleSendMessage} disabled={sending || !draft.trim()}>
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}