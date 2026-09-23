export default function SectionCard({ title, description, accent, to }) {
  return (
    <article className="section-card">
      <div className="section-card__tag">{accent}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <a href={to}>Open section</a>
    </article>
  );
}
