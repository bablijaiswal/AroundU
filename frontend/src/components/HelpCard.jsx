import { Link } from 'react-router-dom';
import UserAvatar from './UserAvatar';

export default function HelpCard({ item }) {
  const creator = item.creatorName || item.creator || item.author || 'Someone';
  const requestId = item._id || item.id;

  return (
    <article className="help-card">
      <div className="person-row">
        <UserAvatar user={{ name: creator }} size="sm" />
        <div>
          <strong>{creator}</strong>
          <small>{item.time}</small>
        </div>
      </div>

      <h4>{item.title}</h4>
      <div className="meta-line meta-line--stacked">
        <span>📍 {item.location}</span>
        <span className="status-pill">{item.status}</span>
      </div>

      <Link to={`/help/${requestId}`} className="text-link text-link--inline">
        View request
      </Link>
    </article>
  );
}
