import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Button from '../components/Button';
import { createPost } from '../services/posts';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Community');
  const [peopleNeeded, setPeopleNeeded] = useState(1);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        location,
        category,
        peopleNeeded: Number(peopleNeeded) || 1,
      };
      const res = await createPost(payload);
      const nextPath = `/join-connect?refresh=${Date.now()}`;
      if (res && res.success && res.data) {
        navigate(nextPath, { replace: true });
      } else {
        navigate(nextPath, { replace: true });
      }
    } catch (err) {
      console.error('Failed to create post', err);
      navigate('/join-connect');
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
          <Link to="/join-connect" className="text-link">Back</Link>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" placeholder="Weekend plans, local meetup, group idea..." />
          </div>
          <div className="field">
            <label>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} type="text" placeholder="Sector 45, Gurgaon" />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell people what you are planning and who should join." />
          </div>
          <div className="field">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Community</option>
              <option>Events</option>
              <option>Outdoors</option>
              <option>Music</option>
            </select>
          </div>
          <div className="field">
            <label>People needed</label>
            <input
              type="number"
              min="1"
              max="20"
              value={peopleNeeded}
              onChange={(e) => setPeopleNeeded(e.target.value)}
              placeholder="1"
            />
          </div>
          <div className="modal__actions">
            <Button variant="secondary" type="button" onClick={() => navigate('/join-connect')}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Publishing…' : 'Publish'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
