import { Link } from 'react-router-dom';
import UserAvatar from './UserAvatar';

export default function JoinPostCard({ post }) {
  // normalize fields from mock or API
  const id = post._id || post.id;
  const creator = post.creatorName || post.creator || post.author || 'Someone';
  const title = post.title || post.head || '';
  const body = post.description || post.body || '';
  const peopleNeeded = post.peopleNeeded || post.seats || 1;
  const location = post.location || post.place || '';
  const time = post.time || (post.createdAt ? new Date(post.createdAt).toLocaleString() : '');

  return (
    <article className="join-card">
      <div className="join-card__head">
        <div className="person-row">
          <UserAvatar user={{ name: creator }} size="sm" />
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
        <span>📍 {location}</span>
        <span>👥 {peopleNeeded} seats</span>
      </div>

      <Link to={`/posts/${id}`} className="text-link text-link--inline">
        View post
      </Link>
    </article>
  );
}
