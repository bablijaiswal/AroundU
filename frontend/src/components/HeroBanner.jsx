import { useAuth } from '../context/AuthContext';

export default function HeroBanner() {
  const { user } = useAuth();
  const userName = user?.displayName || user?.name || 'AroundU User';

  return (
    <section className="hero-banner">
      <div className="hero-banner__content">
        <p className="eyebrow">A local platform for neighborhoods</p>
        <h1>Good evening, {userName}!</h1>
        <p>Discover events, meet people and help each other in your community.</p>
      </div>
      <div className="hero-banner__art" aria-hidden="true" />
    </section>
  );
}
