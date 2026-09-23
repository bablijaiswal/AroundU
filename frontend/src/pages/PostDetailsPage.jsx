import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../components/Button';
import { deletePost, fetchPostById, updatePost } from '../services/posts';
import { createConnection } from '../services/connections';
import { joinPosts } from '../data/mockData';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { requireAuth } from '../utils/authGuard';

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
  const currentUser = user?.name || 'Anjali';
  const currentUserId = user?.id || currentUser;

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

  async function createInboxMessage(recipient, text) {
    try {
      await api.post('/messages', {
        sender: currentUser,
        receiver: recipient,
        text,
        relatedPost: post?._id || post?.id || null,
      });
    } catch (err) {
      console.error('Failed to save message', err);
    }
  }

  async function ensureConversation(recipient, text) {
    const relatedPost = post?._id || post?.id;
    const participants = [currentUser, recipient].sort();
    const existing = await api.get('/conversations', { params: { user: currentUser } });
    const match = (existing.data?.data || []).find((conversation) => {
      const users = (conversation.participants || []).slice().sort();
      return users.length === 2 && users[0] === participants[0] && users[1] === participants[1] && conversation.relatedPost === relatedPost && conversation.conversationType === 'join_connect';
    });

    if (match) {
      await api.post('/messages', {
        sender: currentUser,
        receiver: recipient,
        text,
        conversationId: match._id,
        relatedPost,
        relatedModel: 'Post',
        conversationType: 'join_connect',
      });
      return match._id;
    }

    const res = await api.post('/conversations', {
      participants,
      conversationType: 'join_connect',
      relatedPost,
      relatedModel: 'Post',
      createdBy: currentUser,
    });

    const convId = res.data?.data?._id;
    await api.post('/messages', {
      sender: currentUser,
      receiver: recipient,
      text,
      conversationId: convId,
      relatedPost,
      relatedModel: 'Post',
      conversationType: 'join_connect',
    });
    return convId;
  }

  async function handleJoin() {
    if (!post) return;
    if (!requireAuth({ user, navigate, location })) return;
    setJoining(true);
    try {
      const recipient = post.creator || post.author;
      const payload = {
        requester: currentUserId,
        receiver: recipient,
        relatedPost: post._id || post.id,
      };
      await createConnection(payload);
      const text = `Hi ${recipient}, I saw your post and would like to connect.`;
      await ensureConversation(recipient, text);
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
    const recipient = post.creator || post.author;
    if (!recipient || recipient === currentUser) {
      alert('You cannot message yourself.');
      return;
    }

    const text = `Hi ${recipient}, I saw your post and would like to connect.`;
    await ensureConversation(recipient, text);
    navigate('/messages');
  }

  async function handleSaveSeat() {
    if (!post) return;
    setSaving(true);
    try {
      const nextCount = Number(seatValue) || 1;
      const updated = await updatePost(post._id || post.id, { peopleNeeded: nextCount, creator: currentUser }, currentUser);
      setPost((prev) => ({ ...prev, ...updated.data, peopleNeeded: nextCount }));
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
      await deletePost(post._id || post.id, currentUser);
      navigate('/join-connect');
    } catch (err) {
      console.error('delete failed', err);
      alert('Failed to delete post');
    }
  }

  if (loading) return <div className="content-page">Loading…</div>;

  if (!post) return <div className="content-page">Post not found.</div>;

  const isOwner = String(post.creator || post.author || '') === String(currentUserId || currentUser);
  const remainingSeats = Number(post.peopleNeeded ?? post.seats ?? 1);

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
        <p><strong>By {post.creator || post.author}</strong> · {post.time || (post.createdAt ? new Date(post.createdAt).toLocaleString() : '')}</p>
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
          <div className="modal__actions">
            <Button variant="secondary" onClick={handleMessage}>Message</Button>
            <Button variant="primary" onClick={handleJoin} disabled={joining}>{joining ? 'Sending…' : 'Join'}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
