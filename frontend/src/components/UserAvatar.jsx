export default function UserAvatar({ user, size = 'md', className = '' }) {
  const name = user?.name || user?.author || 'A';
  const initial = name.charAt(0).toUpperCase();
  const avatarSize = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : 'avatar-md';

  return <div className={`avatar ${avatarSize} ${className}`.trim()}>{initial}</div>;
}
