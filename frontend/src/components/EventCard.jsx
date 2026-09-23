import Badge from './Badge';

function getEventDateLabel(date) {
  if (!date) return 'Date not available';
  if (typeof date === 'string') return date;
  if (typeof date === 'object') return date.when || date.start_date || date.value || 'Date not available';
  return String(date);
}

export default function EventCard({ event }) {
  const eventDate = getEventDateLabel(event.date);
  const eventTime = event.time || event.start_time || event.formatted_time || '';
  const eventVenue = event.venue || event.location || event.address || event.city || event.neighborhood || 'Venue not available';
  const eventPrice = event.price || '';

  return (
    <article className="event-card event-card--large">
      <div className="event-card__image-wrap">
        <img src={event.image || event.thumbnail} alt={event.title} className="event-card__image" />
      </div>

      <div className="event-card__body">
        <div className="event-card__row">
          <h4>{event.title}</h4>
          {event.category && <Badge tone="soft">{event.category}</Badge>}
        </div>

        <div className="event-card__meta">
          <span>📅 {eventDate}</span>
          {eventTime && <span>🕒 {eventTime}</span>}
          {eventPrice && <span>💰 {eventPrice}</span>}
        </div>

        <div className="event-card__meta">
          <span>📍 {eventVenue}</span>
        </div>

        {event.description && <p className="event-card__description">{event.description}</p>}
      </div>
    </article>
  );
}
