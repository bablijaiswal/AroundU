import { useEffect, useState } from 'react';
import SearchBar from './SearchBar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LOCATION_STORAGE_KEY = 'aroundu-current-location';

function getSavedLocation() {
  if (typeof window === 'undefined') return 'Sector 45, Gurgaon';
  return localStorage.getItem(LOCATION_STORAGE_KEY) || 'Sector 45, Gurgaon';
}

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, updateProfileData, refreshUser } = useAuth();
  const [locationInput, setLocationInput] = useState('');
  const [displayLocation, setDisplayLocation] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const profileName = user?.displayName || user?.name || user?.email?.split('@')[0] || 'User';
  const locationLabel = user?.city || user?.location || getSavedLocation();

  useEffect(() => {
    if (!isEditingLocation) {
      const next = user?.city || user?.location || getSavedLocation();
      setLocationInput(next);
      setDisplayLocation(next);
    }
  }, [user?.city, user?.location, isEditingLocation]);

  const handleLocationSave = async (nextValueOverride) => {
    const nextValue = String(nextValueOverride ?? locationInput).trim();
    if (!nextValue) {
      const fallback = user?.city || user?.location || getSavedLocation();
      setLocationInput(fallback);
      setDisplayLocation(fallback);
      setIsEditingLocation(false);
      return;
    }

    setLocationInput(nextValue);
    setDisplayLocation(nextValue);
    localStorage.setItem(LOCATION_STORAGE_KEY, nextValue);
    window.dispatchEvent(new CustomEvent('aroundu-location-changed', { detail: { location: nextValue } }));

    try {
      if (user) {
        await updateProfileData({
          name: user?.displayName || user?.name || '',
          bio: user?.bio || '',
          city: nextValue,
          interests: user?.interests || [],
        });
        await refreshUser();
      }
      setDisplayLocation(nextValue);
      setLocationInput(nextValue);
      setIsEditingLocation(false);
    } catch (error) {
      const fallback = user?.city || user?.location || getSavedLocation();
      setLocationInput(fallback);
      setDisplayLocation(fallback);
      setIsEditingLocation(false);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar__search">
        <SearchBar />
      </div>

      <div className="topbar__actions">
        {isEditingLocation ? (
          <div className="location-pill location-pill--input" role="button" tabIndex={0}>
            <span>📍</span>
            <input
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
              onBlur={() => handleLocationSave(locationInput)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleLocationSave(locationInput);
                if (event.key === 'Escape') {
                  setLocationInput(locationLabel);
                  setDisplayLocation(locationLabel);
                  setIsEditingLocation(false);
                }
              }}
              autoFocus
              aria-label="Location"
            />
          </div>
        ) : (
          <div className="location-pill" role="button" tabIndex={0} onClick={() => setIsEditingLocation(true)}>
            <span>📍</span>
            <span>{displayLocation || locationLabel}</span>
          </div>
        )}

        {isAuthenticated ? (
          <>
            <button className="icon-button" aria-label="Notifications" onClick={() => navigate('/notifications')}>🔔</button>
            <button className="icon-button" aria-label="Chat" onClick={() => navigate('/messages')}>💬</button>
            <div className="profile-mini" role="button" tabIndex={0} onClick={() => navigate('/profile')}>
              <div className="avatar avatar-sm">{profileName.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U'}</div>
              <span>{profileName}</span>
              <span className="caret">⌄</span>
            </div>
            <button className="btn btn-secondary" type="button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <button className="btn btn-secondary" type="button" onClick={() => navigate('/login')}>Login</button>
            <button className="btn btn-primary" type="button" onClick={() => navigate('/signup')}>Sign up</button>
          </>
        )}
      </div>
    </header>
  );
}
