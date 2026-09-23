import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import JoinPostCard from '../components/JoinPostCard';
import Button from '../components/Button';
import { joinPosts } from '../data/mockData';
import { fetchPosts } from '../services/posts';

export default function JoinConnectPage() {
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchPosts()
      .then((res) => {
        if (mounted) setPosts(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        // fallback to mock data when API unavailable
        if (mounted) setPosts(joinPosts);
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [location.search]);

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow color-brown">Join / Connect</p>
          <h1>Find people and groups close to home</h1>
        </div>
        <div className="header-actions">
          <Link to="/create-post">
            <Button variant="primary">Create post</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p>Loading posts…</p>
      ) : error ? (
        <p className="muted-text">Failed to load posts.</p>
      ) : (
        <div className="list-grid-2">
          {posts.length === 0 ? (
            <p className="muted-text">No posts yet — be the first to create one.</p>
          ) : (
            posts.map((post) => <JoinPostCard key={post._id || post.id} post={post} />)
          )}
        </div>
      )}
    </div>
  );
}
