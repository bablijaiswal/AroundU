import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import FeaturedEvent from '../components/FeaturedEvent';
import EventCard from '../components/EventCard';
import JoinPostCard from '../components/JoinPostCard';
import HelpCard from '../components/HelpCard';
import { featuredEvents, joinPosts, helpRequests, trustHighlights } from '../data/mockData';

export default function HomePage() {
  const [homeEvents, setHomeEvents] = useState([]);
  const featured = featuredEvents[0];

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch('http://localhost:5001/api/events/external?city=Delhi');
        if (!response.ok) return;
        const data = await response.json();
        const events = Array.isArray(data?.events) ? data.events.slice(0, 3) : [];

        const normalizedEvents = events.map((event, index) => ({
          id: event.link || `${event.title}-${index}`,
          title: event.title || 'Untitled event',
          date: event.date || 'Date not available',
          city: event.venue || event.address || 'Delhi, India',
          neighborhood: event.venue || event.address || 'Delhi, India',
          address: Array.isArray(event.address) ? event.address.join(', ') : event.address || event.venue || 'Delhi, India',
          image: event.thumbnail || '',
          category: 'Featured',
        }));

        setHomeEvents(normalizedEvents);
      } catch (error) {
        setHomeEvents([]);
      }
    }

    loadEvents();
  }, []);

  return (
    <div className="page-stack">
      <HeroBanner />

      <FeaturedEvent event={featured} />

      <section className="preview-grid">
        <div className="section-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow color-brown">Events</p>
              <h3>What is happening around you</h3>
            </div>
            <Link to="/events" className="text-link">View all</Link>
          </div>
          <div className="stack-list">
            {homeEvents.length > 0 ? homeEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            )) : featuredEvents.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>

        <div className="section-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow color-brown">Join / Connect</p>
              <h3>Find people and groups close to home</h3>
            </div>
            <Link to="/join-connect" className="text-link">View all</Link>
          </div>
          <div className="stack-list">
            {joinPosts.slice(0, 3).map((post) => (
              <JoinPostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        <div className="section-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow color-brown">Help Hub</p>
              <h3>Practical help from the community</h3>
            </div>
            <Link to="/help-hub" className="text-link">View all</Link>
          </div>
          <div className="stack-list">
            {helpRequests.slice(0, 3).map((item) => (
              <HelpCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="trust-bar">
        {trustHighlights.map((item) => (
          <div className="trust-chip" key={item.title}>
            <h4>{item.title}</h4>
            <p>{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
