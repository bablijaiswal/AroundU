import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import EventCard from '../components/EventCard';
import JoinPostCard from '../components/JoinPostCard';
import { featuredEvents as mockEvents, joinPosts as mockPosts } from '../data/mockData';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function rankResults(items, term, field = 'title') {
  if (!term) return items;
  const t = term.toLowerCase();
  return items.slice().sort((a, b) => {
    const aTitle = (a[field] || '').toString().toLowerCase();
    const bTitle = (b[field] || '').toString().toLowerCase();
    const aHas = aTitle.includes(t) ? 1 : 0;
    const bHas = bTitle.includes(t) ? 1 : 0;
    if (aHas !== bHas) return bHas - aHas; // items containing term first
    // fallback: shorter title first
    return aTitle.length - bTitle.length;
  });
}

export default function SearchResultsPage() {
  const q = useQuery().get('q') || '';
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const p1 = api.get('/events', { params: { keyword: q } }).then((r) => (r.data && r.data.success ? r.data.data : r.data)).catch(() => mockEvents);
    const p2 = api.get('/posts', { params: { keyword: q } }).then((r) => (r.data && r.data.success ? r.data.data : r.data)).catch(() => mockPosts);

    Promise.all([p1, p2])
      .then(([evs, ps]) => {
        if (!mounted) return;
        setEvents(Array.isArray(evs) ? rankResults(evs, q, 'title') : []);
        setPosts(Array.isArray(ps) ? rankResults(ps, q, 'title') : []);
      })
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, [q]);

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow color-brown">Search</p>
          <h1>Results for “{q}”</h1>
        </div>
        <div className="header-actions">
          <Link to="/">Back</Link>
        </div>
      </div>

      {loading ? (
        <p>Searching…</p>
      ) : (
        <div>
          <section>
            <h3>Events</h3>
            {events.length === 0 ? (
              <p className="muted-text">No events found.</p>
            ) : (
              <div className="list-grid-2">
                {events.map((ev) => (
                  <EventCard key={ev._id || ev.id} event={ev} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h3>Posts</h3>
            {posts.length === 0 ? (
              <p className="muted-text">No posts found.</p>
            ) : (
              <div className="list-grid-2">
                {posts.map((p) => (
                  <JoinPostCard key={p._id || p.id} post={p} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
