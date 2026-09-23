export default function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">○</div>
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  );
}
