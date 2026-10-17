import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { fetchHelpById, respondToHelp, deleteHelp } from '../services/help';
import Button from '../components/Button';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { requireAuth } from '../utils/authGuard';
import { createOrGetConversation } from '../services/conversations';

export default function HelpDetailsPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [responding, setResponding] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const currentUserName = user?.name || user?.displayName || 'User';
  const currentUserId = user?.id || user?.uid || '';

  const myIds = [user?.id, user?.uid, user?.firebaseUid].filter(Boolean).map(String);
  const myNames = [user?.name, user?.displayName, user?.email].filter(Boolean).map((n) => String(n).toLowerCase());
  const recipientId = item?.creatorId || item?.authorId || item?.userId || '';
  const itemAuthorName = String(item?.creatorName || item?.creator || item?.author || '').toLowerCase();

  const isOwner = Boolean(
    (recipientId && myIds.includes(String(recipientId))) ||
    (itemAuthorName && myNames.includes(itemAuthorName))
  );

  useEffect(() => {
    let mounted = true;
    fetchHelpById(id)
      .then((res) => mounted && setItem(res.data || res))
      .catch(() => mounted && setItem(null))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [id]);

  if (loading) return <div className="content-page"><p>Loading…</p></div>;
  if (!item) return <div className="content-page"><p>Request not found.</p></div>;

  const authorName = item.creatorName || item.creator || item.author || 'Community Member';

  const handleRespond = async () => {
    if (!requireAuth({ user, navigate, location })) return;
    setResponding(true);
    try {
      const responder = currentUserName;
      await respondToHelp(id, { responder });

      const refreshed = await fetchHelpById(id);
      setItem(refreshed.data || refreshed);

      const targetRecipient = recipientId || item.creatorName || item.creator;
      if (targetRecipient) {
        const conversation = await createOrGetConversation({
          currentUserId,
          recipientId: targetRecipient,
          conversationType: 'help_request',
          relatedPost: item?._id || id,
          relatedModel: 'HelpRequest',
        });
        navigate(`/messages?conversationId=${conversation?._id || conversation?.id}`);
        return;
      }

      navigate('/messages');
    } catch (err) {
      console.error('help conversation failed', err);
      navigate('/messages');
    } finally {
      setResponding(false);
    }
  };

  const handleMessage = async () => {
    if (!requireAuth({ user, navigate, location })) return;
    if (isOwner || (recipientId && myIds.includes(String(recipientId)))) {
      alert('You cannot message yourself.');
      return;
    }

    const targetRecipient = recipientId || item.creatorName || item.creator;
    if (!targetRecipient) {
      alert('Unable to identify request author.');
      return;
    }

    setMessaging(true);
    try {
      const conversation = await createOrGetConversation({
        currentUserId,
        recipientId: targetRecipient,
        conversationType: 'help_request',
        relatedPost: item?._id || id,
        relatedModel: 'HelpRequest',
      });
      navigate(`/messages?conversationId=${conversation?._id || conversation?.id}`);
    } catch (error) {
      console.error('message conversation failed', error);
      alert(error.response?.data?.message || 'Failed to open messages.');
    } finally {
      setMessaging(false);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm('Delete this help request?');
    if (!ok) return;
    try {
      await deleteHelp(id);
      navigate('/help-hub');
    } catch (err) {
      alert('Failed to delete help request.');
    }
  };

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow color-brown">{item.type === 'need_help' ? 'Needs help' : 'Can help'}</p>
          <h1>{item.title}</h1>
        </div>
        <div className="header-actions">
          <Link to="/help-hub" className="text-link">Back</Link>
          {!isOwner && (
            <>
              <Button variant="secondary" onClick={handleMessage} disabled={messaging}>
                {messaging ? 'Opening…' : 'Message'}
              </Button>
              <Button variant="primary" onClick={handleRespond} disabled={responding}>
                {responding ? 'Responding…' : 'Respond'}
              </Button>
            </>
          )}
          {isOwner && (
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="person-row" style={{ marginBottom: '1rem' }}>
          <UserAvatar user={{ name: authorName, profileImage: item.creatorAvatar }} size="md" />
          <div>
            <strong>{authorName}</strong>
            <small style={{ display: 'block' }}>{item.time || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '')}</small>
          </div>
        </div>

        <p>{item.description}</p>
        <div className="meta-line" style={{ marginTop: '1rem' }}>
          <span>🏷️ Category: {item.category}</span>
          <span>📍 Location: {item.location}</span>
          <span className="status-pill">{item.status || 'open'}</span>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <h3>Responders</h3>
          {item.responders && item.responders.length ? (
            <ul>
              {item.responders.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          ) : (
            <p className="muted-text">No responders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
