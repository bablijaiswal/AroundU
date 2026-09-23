import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { fetchPosts } from '../services/posts';
import { fetchHelp } from '../services/help';
import { fetchConnections } from '../services/connections';

const coverImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

function formatJoinedDate(value) {
  if (!value) return 'Joined recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Joined recently';
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function formatRelativeTime(value) {
  if (!value) return 'just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'just now';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ProfilePage() {
  const { user, updateProfileData } = useAuth();
  const [posts, setPosts] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [postFilter, setPostFilter] = useState('all');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    bio: '',
    city: '',
    interests: '',
    profileImage: '',
  });

  const profileName = user?.displayName || user?.name || 'AroundU User';
  const profileHandle = user?.email ? `@${user.email.split('@')[0]}` : '@aroundu';

  useEffect(() => {
    if (!user) return;

    async function loadProfileData() {
      try {
        const [postRes, helpRes, connectionRes] = await Promise.all([
          fetchPosts(),
          fetchHelp(),
          fetchConnections({ user: user.id }).catch(() => ({ data: [] })),
        ]);

        const allPosts = Array.isArray(postRes) ? postRes : postRes?.data || [];
        const allHelp = Array.isArray(helpRes?.data) ? helpRes.data : helpRes?.data?.data || [];
        const allConnections = Array.isArray(connectionRes?.data) ? connectionRes.data : connectionRes?.data?.data || [];

        const minePosts = allPosts.filter((post) => {
          const sameCreatorId = String(post.creatorId || '') === String(user.id || '');
          const sameCreatorName = String(post.creatorName || post.creator || '').toLowerCase() === String(profileName || '').toLowerCase();
          return sameCreatorId || sameCreatorName;
        });

        const mineHelp = allHelp.filter((item) => {
          const sameCreatorId = String(item.creatorId || '') === String(user.id || '');
          const sameCreatorName = String(item.creatorName || item.creator || '').toLowerCase() === String(profileName || '').toLowerCase();
          return sameCreatorId || sameCreatorName;
        });

        setPosts(minePosts);
        setHelpRequests(mineHelp);
        setConnections(allConnections.filter((conn) => String(conn.requester || '') === String(user.id || '') || String(conn.receiver || '') === String(user.id || '')));
      } catch (error) {
        console.error('Failed to load profile data', error);
        setPosts([]);
        setHelpRequests([]);
        setConnections([]);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [user, profileName]);

  useEffect(() => {
    if (!user) return;
    setDraft({
      name: user.displayName || user.name || '',
      bio: user.bio || '',
      city: user.city || '',
      interests: (user.interests || []).join(', '),
      profileImage: user.profileImage || '',
    });
  }, [user]);

  const profileStats = useMemo(() => {
    const postCount = posts.length;
    const connectionCount = connections.length;
    const helpCount = helpRequests.length;
    return [
      { label: 'Posts', value: postCount },
      { label: 'Events Joined', value: 0 },
      { label: 'Connections', value: connectionCount },
      { label: 'People Helped', value: helpCount },
    ];
  }, [posts.length, connections.length, helpRequests.length]);

  const combinedProfilePosts = useMemo(() => {
    const items = [];
    posts.forEach((post) => {
      items.push({
        id: post._id || post.id,
        kind: 'join_connect',
        type: post.type || 'Join / Connect',
        title: post.title,
        description: post.description || post.body || '',
        createdAt: post.createdAt || post.date,
        category: post.category || '',
        location: post.location || '',
        creator: post.creatorName || post.creator || profileName,
        image: post.image || post.coverImage || '',
        tag: post.category || 'Join / Connect',
      });
    });

    helpRequests.forEach((item) => {
      items.push({
        id: item._id || item.id,
        kind: 'help_hub',
        type: 'Help Hub',
        title: item.title,
        description: item.description || item.body || '',
        createdAt: item.createdAt || item.date,
        category: item.category || '',
        location: item.location || '',
        creator: item.creatorName || item.creator || profileName,
        image: item.image || item.coverImage || '',
        tag: item.category || 'Help Hub',
      });
    });

    return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [posts, helpRequests, profileName]);

  const visiblePosts = useMemo(() => {
    const list = combinedProfilePosts.filter((item) => {
      if (postFilter === 'all') return true;
      if (postFilter === 'join_connect') return item.kind === 'join_connect';
      if (postFilter === 'help_hub') return item.kind === 'help_hub';
      return true;
    });
    return list;
  }, [combinedProfilePosts, postFilter]);

  const handleSaveProfile = async () => {
    try {
      const payload = {
        name: draft.name.trim(),
        bio: draft.bio.trim(),
        city: draft.city.trim(),
        interests: draft.interests
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (!payload.name) return;
      await updateProfileData(payload);
      setIsEditOpen(false);
    } catch (error) {
      console.error('Failed to save profile.', error);
    }
  };

  const aboutText = user?.bio || 'Helping neighbors connect, sharing local events, and staying close to the community.';
  const profileInterests = user?.interests && user.interests.length ? user.interests : ['Travel', 'Music', 'Reading'];
  const profileCity = user?.city || 'Shimla, Himachal Pradesh';
  const joinDate = formatJoinedDate(user?.createdAt || '2025-09-01T00:00:00.000Z');

  if (!user && loading) {
    return <div className="content-page"><div className="empty-state large"><p>Loading profile…</p></div></div>;
  }

  if (!user) {
    return <div className="content-page"><div className="empty-state large"><p>Please sign in to view your profile.</p></div></div>;
  }

  return (
    <div className="content-page profile-page">
      <div className="profile-shell">
        <div className="profile-header-card">
          <div className="profile-cover">
            <img src={coverImage} alt="Profile cover" />
          </div>

          <div className="profile-main">
            <div className="profile-avatar-wrap">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={profileName} className="profile-avatar" />
              ) : (
                <div className="profile-avatar profile-avatar-fallback">{profileName.charAt(0).toUpperCase()}</div>
              )}
            </div>

            <div className="profile-header-copy">
              <div className="profile-header-top">
                <div>
                  <h1>{profileName}</h1>
                  <p className="profile-handle">{profileHandle}</p>
                </div>
                <Button variant="secondary" onClick={() => setIsEditOpen(true)} className="profile-edit-button">Edit Profile</Button>
              </div>

              <div className="profile-status-row">
                <span className="online-dot" />
                <span>Active now</span>
              </div>

              <p className="profile-bio">{aboutText}</p>

              <div className="profile-meta-row">
                <span>📍 {profileCity}</span>
                <span>📅 Joined {joinDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-stats">
          {profileStats.map((stat) => (
            <div key={stat.label} className="profile-stat-card">
              <div className="profile-stat-value">{stat.value}</div>
              <div className="profile-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="profile-content-grid">
          <div className="profile-main-column">
            <div className="profile-tabs">
              {['Posts', 'Events', 'Help Requests', 'Connections', 'Bookmarks'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`profile-tab ${activeTab === tab.toLowerCase().replace(/\s+/g, '-') ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.toLowerCase().replace(/\s+/g, '-'))}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'posts' && (
              <div className="profile-posts-panel">
                <div className="profile-post-header">
                  <h2>My Posts</h2>
                  <Link to="/create-post" className="profile-create-link">+ Create Post</Link>
                </div>

                <div className="profile-post-filters">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'join_connect', label: 'Join / Connect' },
                    { key: 'help_hub', label: 'Help Hub' },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      className={`profile-filter ${postFilter === filter.key ? 'active' : ''}`}
                      onClick={() => setPostFilter(filter.key)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="empty-state compact"><p>Loading your posts…</p></div>
                ) : visiblePosts.length === 0 ? (
                  <div className="empty-state compact"><p>No posts yet for this profile.</p></div>
                ) : (
                  <div className="profile-post-list">
                    {visiblePosts.map((item) => (
                      <article key={item.id} className="profile-post-item">
                        <div className="profile-post-top">
                          <div className="profile-post-user">
                            <div className="mini-avatar">{profileName.charAt(0).toUpperCase()}</div>
                            <div>
                              <strong>{item.creator}</strong>
                              <span>{formatRelativeTime(item.createdAt)}</span>
                            </div>
                          </div>
                          <button type="button" className="profile-more-button">⋮</button>
                        </div>

                        <div className="profile-post-type">{item.type}</div>

                        <h3>{item.title}</h3>
                        <p className="profile-post-description">{item.description}</p>

                        {item.category || item.location ? (
                          <div className="profile-post-tags">
                            {item.category ? <span>{item.category}</span> : null}
                            {item.location ? <span>{item.location}</span> : null}
                          </div>
                        ) : null}

                        {item.image ? (
                          <div className="profile-post-image-wrap">
                            <img src={item.image} alt={item.title} />
                          </div>
                        ) : null}

                        <div className="profile-post-actions">
                          <span>♡ {Math.max(0, Math.round((item.id?.length || 0) / 4))}</span>
                          <span>💬 {Math.max(0, Math.round((item.id?.length || 0) / 5))}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab !== 'posts' && (
              <div className="profile-empty-panel empty-state large">
                <div className="empty-state__icon">✓</div>
                <p>{activeTab === 'events' ? 'No events joined yet.' : activeTab === 'help-requests' ? 'No help requests yet.' : activeTab === 'connections' ? 'No connections yet.' : 'No bookmarks saved yet.'}</p>
              </div>
            )}
          </div>

          <aside className="profile-side-panel">
            <div className="profile-side-card">
              <h3>About</h3>
              <p>{aboutText}</p>
            </div>

            <div className="profile-side-card">
              <h3>Interests</h3>
              <div className="profile-interest-list">
                {profileInterests.map((interest) => (
                  <span key={interest}>{interest}</span>
                ))}
              </div>
            </div>

            <div className="profile-side-card">
              <h3>Location</h3>
              <p>{profileCity}</p>
            </div>

            {(user?.socialLinks || user?.links) && Array.isArray(user.socialLinks || user.links) && (user.socialLinks || user.links).length > 0 ? (
              <div className="profile-side-card">
                <h3>Social Links</h3>
                <div className="profile-links-list">
                  {(user.socialLinks || user.links).map((link) => (
                    <a key={link} href={link} target="_blank" rel="noreferrer">{link}</a>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="profile-side-card">
              <h3>Member Since</h3>
              <p>{joinDate}</p>
            </div>
          </aside>
        </div>
      </div>

      <Modal open={isEditOpen} title="Edit Profile" onClose={() => setIsEditOpen(false)}>
        <div className="form-grid">
          <div className="field">
            <label>Name</label>
            <input value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="field">
            <label>Bio</label>
            <textarea value={draft.bio} onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value }))} />
          </div>
          <div className="field">
            <label>Location</label>
            <input value={draft.city} onChange={(e) => setDraft((prev) => ({ ...prev, city: e.target.value }))} />
          </div>
          <div className="field">
            <label>Interests</label>
            <input value={draft.interests} onChange={(e) => setDraft((prev) => ({ ...prev, interests: e.target.value }))} />
          </div>
          <div className="modal__actions">
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveProfile}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
