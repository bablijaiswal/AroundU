import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from './Button';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { requireAuth } from '../utils/authGuard';
import { createOrGetConversation } from '../services/conversations';
import UserAvatar from './UserAvatar';

export default function HelpCard({ item }) {
  const creator = item.creatorName || item.creator || item.author || 'Community Member';
  const creatorAvatar = item.creatorAvatar || item.userAvatar || '';
  const requestId = item._id || item.id;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [messaging, setMessaging] = useState(false);
  const currentUserId = user?.id || user?.uid || '';

  const myIds = [user?.id, user?.uid, user?.firebaseUid].filter(Boolean).map(String);
  const myNames = [user?.name, user?.displayName, user?.email].filter(Boolean).map((n) => String(n).toLowerCase());
  const recipientId = item.creatorId || item.authorId || item.userId || '';
  const itemAuthorName = String(item.creatorName || item.creator || item.author || '').toLowerCase();

  const isOwnRequest = Boolean(
    (recipientId && myIds.includes(String(recipientId))) ||
    (itemAuthorName && myNames.includes(itemAuthorName))
  );

  async function handleMessage() {
    if (!requireAuth({ user, navigate, location })) return;
    if (isOwnRequest || (recipientId && myIds.includes(String(recipientId)))) {
      window.alert('You cannot message yourself.');
      return;
    }

    const targetRecipient = recipientId || item.creatorName || item.creator;
    if (!targetRecipient) {
      window.alert('Unable to identify the request author.');
      return;
    }

    setMessaging(true);
    try {
      const conversation = await createOrGetConversation({
        currentUserId,
        recipientId: targetRecipient,
        conversationType: 'help_request',
        relatedPost: requestId,
        relatedModel: 'HelpRequest',
      });
      navigate(`/messages?conversationId=${conversation?._id || conversation?.id}`);
    } catch (error) {
      console.error('Failed to open help conversation', error);
      const msg = error.response?.data?.message || error.message || 'Failed to open messages. Please try again.';
      window.alert(msg);
    } finally {
      setMessaging(false);
    }
  }

  const time = item.time || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '');

  return (
    <article className="help-card">
      <div className="person-row">
        <UserAvatar user={{ name: creator, profileImage: creatorAvatar }} size="sm" />
        <div>
          <strong>{creator}</strong>
          <small>{time}</small>
        </div>
      </div>

      <h4>{item.title}</h4>
      <div className="meta-line meta-line--stacked">
        <span>📍 {item.location}</span>
        <span className="status-pill">{item.status || 'open'}</span>
      </div>

      {!isOwnRequest && (
        <div className="modal__actions" style={{ justifyContent: 'flex-start', marginTop: '0.25rem' }}>
          <Button variant="secondary" size="sm" type="button" onClick={handleMessage} disabled={messaging}>
            {messaging ? 'Opening…' : 'Message'}
          </Button>
        </div>
      )}

      <Link to={`/help/${requestId}`} className="text-link text-link--inline">
        View request
      </Link>
    </article>
  );
}
