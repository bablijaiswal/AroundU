import Button from '../components/Button';

export default function SettingsPage() {
  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow color-brown">Settings</p>
          <h1>Manage your preferences</h1>
        </div>
      </div>

      <div className="form-card">
        <div className="form-grid">
          <div className="field">
            <label>Neighborhood</label>
            <input type="text" defaultValue="Sector 45, Gurgaon" />
          </div>
          <div className="field">
            <label>Notifications</label>
            <select defaultValue="Enabled">
              <option>Enabled</option>
              <option>Quiet hours</option>
              <option>Disabled</option>
            </select>
          </div>
          <div className="modal__actions">
            <Button variant="secondary">Reset</Button>
            <Button variant="primary">Save changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
