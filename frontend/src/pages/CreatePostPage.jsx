import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Button from '../components/Button';
import { createPost } from '../services/posts';
import { useAuth } from '../context/AuthContext';
import { requireAuth } from '../utils/authGuard';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Community');
  const [peopleNeeded, setPeopleNeeded] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!requireAuth({ user, navigate, location: { pathname: '/create-post', search: '' } })) return;

    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Please enter a post title.');
      return;
    }

    if (!location.trim()) {
      setError('Please enter a location.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description.');
      return;
    }

    const peopleCount = Number(peopleNeeded);

    if (
      !Number.isInteger(peopleCount) ||
      peopleCount < 1 ||
      peopleCount > 20
    ) {
      setError('People needed must be between 1 and 20.');
      return;
    }

    const payload = {
      title: title.trim(),
      location: location.trim(),
      description: description.trim(),
      category,
      peopleNeeded: peopleCount,
    };

    setSaving(true);

    try {
      console.log('Creating Join / Connect post:', payload);

      const res = await createPost(payload);

      console.log('Create post response:', res);

      if (!res?.success || !res?.data) {
        throw new Error(
          res?.message || 'The server did not confirm post creation.'
        );
      }

      setSuccess('Your post was published successfully!');

      navigate(`/join-connect?refresh=${Date.now()}`, {
        replace: true,
        state: { postCreated: true },
      });
    } catch (err) {
      console.error('Failed to create post:', err);

      const message =
        err.response?.data?.message ||
        err.message ||
        'Something went wrong while creating your post.';

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow color-brown">Create Post</p>
          <h1>Share something with your community</h1>
        </div>

        <div className="header-actions">
          <Link to="/join-connect" className="text-link">
            Back
          </Link>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        {error && (
          <div role="alert" className="form-error">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="form-success">
            {success}
          </div>
        )}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="post-title">Title</label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekend plans, local meetup, group idea..."
              maxLength={150}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="post-location">Location</label>
            <input
              id="post-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Sector 45, Gurgaon"
              maxLength={150}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="post-description">Description</label>
            <textarea
              id="post-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people what you are planning and who should join."
              rows={5}
              maxLength={2000}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="post-category">Category</label>
            <select
              id="post-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Community">Community</option>
              <option value="Events">Events</option>
              <option value="Outdoors">Outdoors</option>
              <option value="Music">Music</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="people-needed">People needed</label>
            <input
              id="people-needed"
              type="number"
              min="1"
              max="20"
              step="1"
              value={peopleNeeded}
              onChange={(e) => setPeopleNeeded(e.target.value)}
              required
            />
          </div>

          <div className="modal__actions">
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/join-connect')}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
