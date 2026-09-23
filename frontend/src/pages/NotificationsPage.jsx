import { notifications } from '../data/mockData';
import NotificationItem from '../components/NotificationItem';

export default function NotificationsPage() {
  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow color-brown">Notifications</p>
          <h1>Updates from around your neighborhood</h1>
        </div>
      </div>

      <div className="list-card">
        <div className="notification-list">
          {notifications.map((item) => (
            <NotificationItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
