export default function MessagePreview({ message }) {
  const person = message.user || message.id || 'Contact';
  const previewText = message.preview || 'No messages yet';

  return (
    <div className="message-preview">
      <div className="avatar avatar-sm">{person.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'C'}</div>
      <div className="message-preview__content">
        <div className="message-preview__head">
          <strong>{person}</strong>
          <span>{message.time}</span>
        </div>
        <p>{previewText}</p>
      </div>
      {message.unread > 0 && <span className="unread-badge">{message.unread}</span>}
    </div>
  );
}
