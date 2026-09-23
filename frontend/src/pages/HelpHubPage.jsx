import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import HelpCard from '../components/HelpCard';
import Button from '../components/Button';
import { helpRequests as mockHelp } from '../data/mockData';
import { fetchHelp } from '../services/help';

export default function HelpHubPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchHelp()
      .then((res) => {
        if (mounted) setList(res && res.success ? res.data : []);
      })
      .catch(() => {
        if (mounted) setList(mockHelp);
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow color-brown">Help Hub</p>
          <h1>Practical help from the community</h1>
        </div>
        <div className="header-actions">
          <Link to="/create-help-request">
            <Button variant="primary">Ask for help</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="list-grid-2">
          {list.length === 0 ? (
            <p className="muted-text">No help requests yet.</p>
          ) : (
            list.map((item) => <HelpCard key={item._id || item.id} item={item} />)
          )}
        </div>
      )}
    </div>
  );
}
