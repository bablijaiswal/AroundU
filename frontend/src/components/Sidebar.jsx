import { NavLink } from 'react-router-dom';
import Button from './Button';

const items = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/events', label: 'Events', icon: '◫' },
  { to: '/join-connect', label: 'Join / Connect', icon: '◌' },
  { to: '/help-hub', label: 'Help Hub', icon: '◔' },
  { to: '/messages', label: 'Messages', icon: '✉' },
  { to: '/notifications', label: 'Notifications', icon: '◍' },
  { to: '/bookmarks', label: 'Bookmarks', icon: '▣' },
  { to: '/profile', label: 'My Profile', icon: '◉' },
];

export default function Sidebar({ onAssistantOpen }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="brand-mark">◉</div>
        <div>
          <div className="brand-name">AroundU</div>
          <div className="brand-sub">Your community. Your people.</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar__icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__assistant">
        <div className="assistant-badge">✦</div>
        <div className="assistant-title">AroundU Assistant</div>
        <div className="assistant-copy">
          Ask, find &amp; connect
          <br />
          with your community.
        </div>
        <Button variant="primary" className="assistant-button" onClick={onAssistantOpen}>
          Open Assistant
        </Button>
      </div>
    </aside>
  );
}
