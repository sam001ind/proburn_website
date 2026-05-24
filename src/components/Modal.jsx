import { X } from 'lucide-react';
import './Modal.css';

/**
 * All panels slide in from the LEFT, anchored to TOP.
 * This is the app-wide standard.
 * sidePanel={true} → left slide-in panel (default behavior)
 * sidePanel={false} (or omitted) → centered modal
 */
export default function Modal({ isOpen, onClose, title, children, sidePanel = false }) {
  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay ${sidePanel ? 'side-panel-overlay' : ''}`}
      onClick={onClose}
    >
      <div
        className={`modal-container glass-panel ${sidePanel ? 'side-panel animate-slide-left' : 'animate-fade-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
