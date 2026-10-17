import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Button from './Button';
import UserAvatar from './UserAvatar';
import { useAuth } from '../context/AuthContext';
import { requireAuth } from '../utils/authGuard';
import { createOrGetConversation } from '../services/conversations';

export default function JoinPostCard({ post }) {
  const navigate = useNavigate();
  const currentLocation = useLocation();
  const { user } = useAuth();
  const [messaging, setMessaging] = useState(false);

  const id = post._id || post.id;
  const creator = post.creatorName || post.creator || post.author || 'Community Member';
  const creatorAvatar = post.creatorAvatar || post.userAvatar || '';
  const currentUserId = user?.id || user?.uid || '';

  const myIds = [user?.id, user?.uid, user?.firebaseUid].filter(Boolean).map(String);
  const myNames = [user?.name, user?.displayName, user?.email].filter(Boolean).map((n) => String(n).toLowerCase());
  const recipientId = post.creatorId || post.authorId || post.userId || '';
  const postAuthorName = String(post.creatorName || post.creator || post.author || '').toLowerCase();

  const isOwnPost = Boolean(
    (recipientId && myIds.includes(String(recipientId))) ||
    (postAuthorName && myNames.includes(postAuthorName))
  );

  const title = post.title || post.head || '';
  const body = post.description || post.body || '';
  const peopleNeeded = post.peopleNeeded || post.seats || 1;
  const postLocation = post.location || post.place || '';
  const time = post.time || (post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '');

  async function handleMessage() {
    if (!requireAuth({ user, navigate, location: currentLocation })) return;
    if (isOwnPost || (recipientId && myIds.includes(String(recipientId)))) {
      window.alert('You cannot message yourself.');
      return;
    }

    const targetRecipient = recipientId || post.creatorName || post.creator;
    if (!targetRecipient) {
      window.alert('Unable to identify the post author.');
      return;
    }

    setMessaging(true);
    try {
      const conversation = await createOrGetConversation({
        currentUserId,
        recipientId: targetRecipient,
        conversationType: 'join_connect',
        relatedPost: id,
        relatedModel: 'Post',
      });
      navigate(`/messages?conversationId=${conversation?._id || conversation?.id}`);
    } catch (error) {
      console.error('Failed to start conversation', error);
      const msg = error.response?.data?.message || error.message || 'Failed to open messages. Please try again.';
      window.alert(msg);
    } finally {
      setMessaging(false);
    }
  }

  return (
    <article className="join-card">
      <div className="join-card__head">
        <div className="person-row">
          <UserAvatar user={{ name: creator, profileImage: creatorAvatar }} size="sm" />
          <div>
            <strong>{creator}</strong>
            <small>{time}</small>
          </div>
        </div>
        <span className="muted-text">Looking for {peopleNeeded} people</span>
      </div>

      <h4>{title}</h4>
      <p>{body}</p>

      <div className="meta-line">
        <span>📍 {postLocation}</span>
        <span>👥 {peopleNeeded} seats</span>
      </div>

      {!isOwnPost && (
        <div className="modal__actions" style={{ justifyContent: 'flex-start', marginTop: '0.25rem' }}>
          <Button variant="secondary" size="sm" type="button" onClick={handleMessage} disabled={messaging}>
            {messaging ? 'Opening…' : 'Message'}
          </Button>
        </div>
      )}

      <Link to={`/posts/${id}`} className="text-link text-link--inline">
        View post
      </Link>
    </article>
  );
}
