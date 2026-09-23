import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Button from '../components/Button';
import { createHelp } from '../services/help';

export default function CreateHelpRequestPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      await createHelp({
        title,
        location,
        description,
        category,
        type: 'need_help',
      });
      navigate('/help-hub');
    } catch (err) {
      console.error('Failed to create help request', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow color-brown">Create Help Request</p>
          <h1>Ask for support from your neighbors</h1>
        </div>
        <div className="header-actions">
          <Link to="/help-hub" className="text-link">Back</Link>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" placeholder="Need help with home repair, groceries, ride, etc." required />
          </div>
          <div className="field">
            <label>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} type="text" placeholder="Sector 45, Gurgaon" required />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what kind of help you need and when you need it." required />
          </div>
          <div className="field">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Other</option>
              <option>Errands</option>
              <option>Repair</option>
              <option>Transport</option>
              <option>Childcare</option>
            </select>
          </div>
          <div className="modal__actions">
            <Button variant="secondary" type="button" onClick={() => navigate('/help-hub')}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
