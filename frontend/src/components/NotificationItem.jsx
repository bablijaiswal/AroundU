export default function NotificationItem({ item }) {
  return (
    <div className="notification-item">
      <div className="notification-item__icon">{item.type === 'event' ? '•' : item.type === 'join' ? '◌' : item.type === 'help' ? '✦' : '✉'}</div>
      <div className="notification-item__content">
        <strong>{item.title}</strong>
        <p>{item.text}</p>
      </div>
      <span className="notification-item__time">{item.time}</span>
    </div>
  );
}
