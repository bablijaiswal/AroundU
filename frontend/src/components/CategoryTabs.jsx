export default function CategoryTabs({ categories, active, onChange }) {
  return (
    <div className="category-tabs">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={`category-tab ${active === category ? 'active' : ''}`}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
