import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar({ placeholder = 'Search events, people, help and more...' }) {
  const [q, setQ] = useState('');

  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    const term = (q || '').trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <form className="searchbar" onSubmit={submit} role="search">
      <span className="searchbar__icon">⌕</span>
      <input value={q} onChange={(e) => setQ(e.target.value)} type="text" placeholder={placeholder} aria-label="Search" />
    </form>
  );
}
