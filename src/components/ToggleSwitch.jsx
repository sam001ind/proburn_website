import './ToggleSwitch.css';

/**
 * Props:
 *  checked  - boolean
 *  onChange - function(newBool)
 *  label    - string (optional)
 *  size     - 'sm' | 'md' (default 'md')
 */
export default function ToggleSwitch({ checked, onChange, label, size = 'md' }) {
  return (
    <label className={`toggle-wrap toggle-${size}`}>
      <div className={`toggle-track ${checked ? 'on' : 'off'}`} onClick={() => onChange(!checked)}>
        <div className="toggle-thumb" />
      </div>
      {label && (
        <span className="toggle-label">
          {label}
          <span className={`toggle-badge ${checked ? 'visible' : 'hidden'}`}>
            {checked ? 'Visible' : 'Hidden'}
          </span>
        </span>
      )}
    </label>
  );
}
