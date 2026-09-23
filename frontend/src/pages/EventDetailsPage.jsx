import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../components/Button';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { requireAuth } from '../utils/authGuard';

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data?.data || null);
      } catch (err) {
        setError(err.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    setBookmarked(list.includes(id));
  }, [id]);

  function toggleBookmark() {
    if (!requireAuth({ user, navigate, location, message: 'Please sign in to continue.' })) return;
    const list = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    let next;
    if (list.includes(id)) {
      next = list.filter((x) => x !== id);
      setBookmarked(false);
    } else {
      next = [...list, id];
      setBookmarked(true);
    }
    localStorage.setItem('bookmarks', JSON.stringify(next));
  }

  if (loading) return <p>Loading event…</p>;
  if (error) return <p className="text-error">{error}</p>;
  if (!event) return <EmptyState title="Event not found" description="This event may have been removed." />;

  const { latitude, longitude, address } = event;
  const mapsQuery = latitude && longitude
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || event.venue || '')}`;

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow color-brown">Event Details</p>
          <h1>{event.title}</h1>
        </div>
        <div className="header-actions">
          <Link to="/events" className="text-link">Back to events</Link>
        </div>
      </div>

      <div className="detail-card">
        {event.image && <img src={event.image} alt={event.title} className="detail-card__image" />}
        <div className="meta-list">
          <div className="meta-item">📍 {event.venue || event.address}</div>
          <div className="meta-item">📅 {new Date(event.date).toLocaleDateString()}</div>
          <div className="meta-item">🕒 {event.startTime || event.time || '—'}</div>
        </div>
        <p>{event.description}</p>
        <div className="modal__actions">
          <Button variant="secondary" onClick={toggleBookmark}>{bookmarked ? 'Bookmarked' : 'Save'}</Button>
          <Button variant="primary" onClick={() => window.open(mapsQuery, '_blank')}>Open in Maps</Button>
        </div>
      </div>
    </div>
  );
}
