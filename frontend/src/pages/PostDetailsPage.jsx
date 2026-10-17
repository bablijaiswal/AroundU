import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../components/Button';
import UserAvatar from '../components/UserAvatar';
import { deletePost, fetchPostById, updatePost } from '../services/posts';
import { createConnection } from '../services/connections';
import { joinPosts } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { requireAuth } from '../utils/authGuard';
import { createOrGetConversation } from '../services/conversations';

export default function PostDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [editing, setEditing] = useState(false);
  const [seatValue, setSeatValue] = useState(1);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const currentUserName = user?.name || user?.displayName || 'User';
  const currentUserId = user?.id || user?.uid || '';

  const myIds = [user?.id, user?.uid, user?.firebaseUid].filter(Boolean).map(String);
  const myNames = [user?.name, user?.displayName, user?.email].filter(Boolean).map((n) => String(n).toLowerCase());
  const recipientId = post?.creatorId || post?.authorId || post?.userId || '';
  const postAuthorName = String(post?.creatorName || post?.creator || post?.author || '').toLowerCase();

  const isOwner = Boolean(
    (recipientId && myIds.includes(String(recipientId))) ||
    (postAuthorName && myNames.includes(postAuthorName))
  );

  useEffect(() => {
    let mounted = true;
    fetchPostById(id)
      .then((res) => {
        if (mounted) {
          setPost(res);
          setSeatValue(Number(res?.peopleNeeded ?? res?.seats ?? 1));
        }
      })
      .catch(() => {
        const mocked = joinPosts.find((p) => p.id === id) || joinPosts[0];
        if (mounted) {
          setPost(mocked);
          setSeatValue(Number(mocked?.peopleNeeded ?? mocked?.seats ?? 1));
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [id]);

  async function handleJoin() {
    if (!post) return;
    if (!requireAuth({ user, navigate, location })) return;
    setJoining(true);
    try {
      const targetRecipient = recipientId || post.creatorName || post.creator;
      const payload = {
        requester: currentUserId,
        receiver: targetRecipient,
        relatedPost: post._id || post.id,
      };
      await createConnection(payload);
      if (targetRecipient) {
        const conversation = await createOrGetConversation({
          currentUserId,
          recipientId: targetRecipient,
          conversationType: 'join_connect',
          relatedPost: post._id || post.id,
          relatedModel: 'Post',
        });
        navigate(`/messages?conversationId=${conversation?._id || conversation?.id}`);
        return;
      }
      alert('Request sent');
      navigate('/messages');
    } catch (err) {
      console.error('connect failed', err);
      alert('Failed to send request');
    } finally {
      setJoining(false);
    }
  }

  async function handleMessage() {
    if (!post) return;
    if (!requireAuth({ user, navigate, location })) return;
    if (isOwner || (recipientId && myIds.includes(String(recipientId)))) {
      alert('You cannot message yourself.');
      return;
    }

    const targetRecipient = recipientId || post.creatorName || post.creator;
    if (!targetRecipient) {
      alert('Unable to identify the post author.');
      return;
    }

    try {
      const conversation = await createOrGetConversation({
        currentUserId,
        recipientId: targetRecipient,
        conversationType: 'join_connect',
        relatedPost: post._id || post.id,
        relatedModel: 'Post',
      });
      navigate(`/messages?conversationId=${conversation?._id || conversation?.id}`);
    } catch (err) {
      console.error('Failed to open message conversation', err);
      alert(err.response?.data?.message || 'Failed to open messages.');
    }
  }

  async function handleSaveSeat() {
    if (!post) return;
    setSaving(true);
    try {
      const nextCount = Number(seatValue) || 1;
      const updated = await updatePost(post._id || post.id, { peopleNeeded: nextCount, creator: currentUserName }, currentUserName);
      setPost((prev) => ({ ...prev, ...(updated.data || updated), peopleNeeded: nextCount }));
      setEditing(false);
    } catch (err) {
      console.error('update failed', err);
      alert('Failed to update seats');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post) return;
    const ok = window.confirm('Delete this post?');
    if (!ok) return;

    try {
      await deletePost(post._id || post.id, currentUserId);
      navigate('/join-connect');
    } catch (err) {
      console.error('delete failed', err);
      alert('Failed to delete post');
    }
  }

  if (loading) return <div className="content-page">Loading…</div>;
  if (!post) return <div className="content-page">Post not found.</div>;

  const remainingSeats = Number(post.peopleNeeded ?? post.seats ?? 1);
  const authorName = post.creatorName || post.creator || post.author || 'Community Member';

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow color-brown">Join / Connect</p>
          <h1>{post.title}</h1>
        </div>
        <div className="header-actions">
          <Link to="/join-connect" className="text-link">Back</Link>
        </div>
      </div>

      <div className="detail-card">
        <div className="person-row" style={{ marginBottom: '1rem' }}>
          <UserAvatar user={{ name: authorName, profileImage: post.creatorAvatar }} size="md" />
          <div>
            <strong>{authorName}</strong>
            <small style={{ display: 'block' }}>{post.time || (post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '')}</small>
          </div>
        </div>

        <p>{post.description || post.body}</p>
        <div className="meta-line">
          <span>📍 {post.location}</span>
          <span>👥 {isOwner ? `Seats left: ${remainingSeats}` : `Looking for ${remainingSeats} more`}</span>
        </div>

        {isOwner && (
          <div className="modal__actions" style={{ marginTop: '1rem', justifyContent: 'flex-start' }}>
            {!editing ? (
              <>
                <Button variant="secondary" onClick={() => setEditing(true)}>Edit seats</Button>
                <Button variant="secondary" onClick={handleDelete}>Delete</Button>
              </>
            ) : (
              <>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={seatValue}
                  onChange={(e) => setSeatValue(e.target.value)}
                  style={{ width: 100 }}
                />
                <Button variant="primary" onClick={handleSaveSeat} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              </>
            )}
          </div>
        )}

        {!isOwner && (
          <div className="modal__actions" style={{ marginTop: '1rem', justifyContent: 'flex-start' }}>
            <Button variant="secondary" onClick={handleMessage}>Message</Button>
            <Button variant="primary" onClick={handleJoin} disabled={joining}>{joining ? 'Sending…' : 'Join'}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
