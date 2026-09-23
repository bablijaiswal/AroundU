import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CategoryTabs from '../components/CategoryTabs';
import EventCard from '../components/EventCard';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { categories } from '../data/mockData';

const LOCATION_STORAGE_KEY = 'aroundu-current-location';

function getSavedLocation() {
  if (typeof window === 'undefined') return 'Delhi';
  const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
  return saved || 'Delhi';
}

function getCityFromLocation(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'Delhi';

  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) || raw;
}

function buildCityCandidates(value) {
  const candidates = [];
  const raw = String(value || '').trim();

  if (raw) {
    const city = getCityFromLocation(raw);
    candidates.push(city);
    const compact = city.replace(/^(sector|sec)\s*\d+/i, '').trim();
    if (compact && compact !== city) candidates.push(compact);
    const withoutState = raw.split(',').filter(Boolean).map((part) => part.trim());
    if (withoutState.length > 1) {
      candidates.push(withoutState[withoutState.length - 1]);
    }
  }

  if (!candidates.includes('Delhi')) candidates.push('Delhi');
  return [...new Set(candidates.filter(Boolean))];
}

export default function EventsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationVersion, setLocationVersion] = useState(0);

  useEffect(() => {
    const sync = () => setLocationVersion((v) => v + 1);
    window.addEventListener('aroundu-location-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('aroundu-location-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    async function load() {
      const locationValue = user?.city || user?.location || getSavedLocation();
      const cityCandidates = buildCityCandidates(locationValue);
      setLoading(true);
      setError(null);

      try {
        let fetchedEvents = [];

        for (const city of cityCandidates) {
          const response = await fetch(`http://localhost:5001/api/events/external?city=${encodeURIComponent(city)}`);
          if (!response.ok) continue;

          const data = await response.json();
          const nextEvents = Array.isArray(data?.events) ? data.events : [];
          if (nextEvents.length > 0) {
            fetchedEvents = nextEvents;
            break;
          }
        }

        const normalizedEvents = fetchedEvents.map((event, index) => {
          const address = Array.isArray(event.address)
            ? event.address.join(', ')
            : event.address || event.venue || 'Delhi, India';

          return {
            _id: event.link || `${event.title}-${index}`,
            id: event.link || `${event.title}-${index}`,
            title: event.title || 'Untitled event',
            date: event.date || 'Date TBD',
            time: event.time || '',
            venue: event.venue || '',
            address,
            link: event.link || '#',
            thumbnail: event.thumbnail || '',
            description: event.description || '',
            image: event.thumbnail || '',
            city: event.venue || address,
            neighborhood: event.venue || address,
            price: event.price || '',
            category: activeTab !== 'All' ? activeTab : 'Featured',
          };
        }).slice(0, 20);

        setEvents(normalizedEvents);
        if (normalizedEvents.length === 0) {
          setError('No events found');
        }
      } catch (err) {
        setError('Unable to load events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [activeTab, user?.city, user?.location, locationVersion]);

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow color-brown">Events</p>
          <h1>What is happening nearby</h1>
        </div>
        <div className="header-actions">
          <Link to="/" className="text-link">Back home</Link>
        </div>
      </div>

      <div className="section-panel">
        <CategoryTabs categories={categories} active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="list-grid-3">
        {loading && <p>Loading events…</p>}
        {!loading && error && <p className="text-error">{error}</p>}
        {!loading && !error && events.length === 0 && (
          <EmptyState title="No events found" description="Try another category or check back later." />
        )}
        {!loading && !error && events.map((event) => (
          <EventCard key={event._id || event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
