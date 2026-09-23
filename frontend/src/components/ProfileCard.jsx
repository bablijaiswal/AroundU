import UserAvatar from './UserAvatar';

export default function ProfileCard({ user, subtitle }) {
  return (
    <div className="profile-card">
      <UserAvatar user={user} size="lg" />
      <div>
        <h3>{user.name}</h3>
        <p>{subtitle || user.role}</p>
      </div>
    </div>
  );
}
