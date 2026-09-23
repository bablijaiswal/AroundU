import { bookmarks } from '../data/mockData';

export default function BookmarksPage() {
  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow color-brown">Bookmarks</p>
          <h1>Saved for later</h1>
        </div>
      </div>

      <div className="list-card">
        <ul className="bookmark-list">
          {bookmarks.map((bookmark) => (
            <li key={bookmark}>{bookmark}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
