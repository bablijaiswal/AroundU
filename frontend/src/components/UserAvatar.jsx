import { useState } from 'react';

export default function UserAvatar({ user, size = 'md', className = '' }) {
  const [imageError, setImageError] = useState(false);
  const name = user?.name || user?.creator || user?.author || user?.displayName || 'User';
  const initial = (name.charAt(0) || 'U').toUpperCase();
  const avatarSize = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : 'avatar-md';
  const imageUrl = !imageError ? (user?.profileImage || user?.avatar || user?.photoURL || '') : '';

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`avatar ${avatarSize} ${className}`.trim()}
        style={{ objectFit: 'cover' }}
        onError={() => setImageError(true)}
      />
    );
  }

  return <div className={`avatar ${avatarSize} ${className}`.trim()}>{initial}</div>;
}
