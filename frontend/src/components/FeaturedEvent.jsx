import Button from './Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function FeaturedEvent({ event }) {
  const { user } = useAuth();
  if (!event) return null;

  const isMockEvent = event.title === 'Indie Music Night';
  const userName = user?.displayName || user?.name || 'AroundU User';

  const title = isMockEvent ? 'Explore local community moments' : event.title;
  const eyebrow = isMockEvent ? 'Local happenings' : 'Featured Event';
  const description = isMockEvent
    ? 'Find live music, neighborhood meetups, and people around you who are sharing the same vibe.'
    : event.description;

  return (
    <section className="featured-event">
      <img src={event.image} alt={event.title} className="featured-event__image" />

      <div className="featured-event__content">
        <div className="eyebrow">{eyebrow}</div>
        <h3>{title}</h3>

        {!isMockEvent && (
          <div className="meta-list">
            <div className="meta-item">📍 {event.venue}</div>
            <div className="meta-item">📅 {event.date}</div>
            <div className="meta-item">🕒 {event.time}</div>
          </div>
        )}

        <p>{description}</p>

        <div className="featured-event__footer">
          <Link to={`/events/${event.id}`}>
            <Button variant="primary">View Details</Button>
          </Link>
          <div className="nav-dots" aria-label="Browse related events">
            <span>‹</span>
            <span>•</span>
            <span>•</span>
            <span>›</span>
          </div>
        </div>
      </div>
    </section>
  );
}
