import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchHelpById, respondToHelp, deleteHelp } from '../services/help';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { requireAuth } from '../utils/authGuard';

export default function HelpDetailsPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const currentUser = user?.name || 'Anjali';
  const currentUserId = user?.id || currentUser;

  useEffect(() => {
    let mounted = true;
    fetchHelpById(id)
      .then((res) => mounted && setItem(res.data))
      .catch(() => mounted && setItem(null))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (!item) return <p>Request not found.</p>;

  const handleRespond = async () => {
    if (!requireAuth({ user, navigate, location })) return;
    const responder = currentUser;
    await respondToHelp(id, { responder });

    const recursion = await fetchHelpById(id);
    setItem(recursion.data);

    const recipient = item?.creator || currentUser;
    const text = `Hi ${recipient}, I can help with this.`;
    const relatedPost = item?._id || id;

    try {
      const existing = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/conversations?user=${encodeURIComponent(responder)}`);
      const parsed = await existing.json();
      const conversations = parsed.data || [];
      const match = conversations.find((conversation) => {
        const users = (conversation.participants || []).slice().sort();
        return users.length === 2 && users[0] === [responder, recipient].sort()[0] && users[1] === [responder, recipient].sort()[1] && conversation.relatedPost === relatedPost && conversation.conversationType === 'help_request';
      });

      if (match) {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: responder, receiver: recipient, text, conversationId: match._id, relatedPost, relatedModel: 'HelpRequest', conversationType: 'help_request' }),
        });
      } else {
        const createdConversation = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participants: [responder, recipient].sort(), conversationType: 'help_request', relatedPost, relatedModel: 'HelpRequest', createdBy: responder }),
        });
        const convData = await createdConversation.json();
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: responder, receiver: recipient, text, conversationId: convData.data?._id, relatedPost, relatedModel: 'HelpRequest', conversationType: 'help_request' }),
        });
      }

      navigate('/messages');
    } catch (err) {
      console.error('help conversation failed', err);
      navigate('/messages');
    }
  };

  const handleDelete = async () => {
    // optimistic: frontend doesn't manage auth header; backend checks x-user-id
    await deleteHelp(id);
    navigate('/help');
  };

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow color-brown">{item.type === 'need_help' ? 'Needs help' : 'Can help'}</p>
          <h1>{item.title}</h1>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={handleRespond}>Respond</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      <div className="card">
        <p>{item.description}</p>
        <p className="muted-text">Category: {item.category}</p>
        <p className="muted-text">Location: {item.location}</p>
        <p className="muted-text">Status: {item.status}</p>
        <div>
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
