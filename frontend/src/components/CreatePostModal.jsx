import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

export default function CreatePostModal({ open, onClose }) {
  const [text, setText] = useState('');

  return (
    <Modal open={open} title="Create a post" onClose={onClose}>
      <div className="form-stack">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share something with your neighborhood..."
          rows={5}
        />
        <div className="modal__actions">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onClose} disabled={!text.trim()}>Post</Button>
        </div>
      </div>
    </Modal>
  );
}
