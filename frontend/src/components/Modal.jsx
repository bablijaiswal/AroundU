export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <h3>{title}</h3>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close modal">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
