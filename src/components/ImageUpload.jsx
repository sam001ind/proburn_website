import { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, CheckCircle, AlertCircle, Crop, ZoomIn, ZoomOut } from 'lucide-react';
import './ImageUpload.css';

/* ─── Crop raw pixels → compressed base64 JPEG ─── */
async function getCroppedBase64(imageSrc, croppedAreaPixels, outputWidth, outputHeight, quality = 0.82) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width  = outputWidth  || Math.min(croppedAreaPixels.width,  1200);
  canvas.height = outputHeight || Math.min(croppedAreaPixels.height, 1200);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    croppedAreaPixels.x, croppedAreaPixels.y,
    croppedAreaPixels.width, croppedAreaPixels.height,
    0, 0, canvas.width, canvas.height
  );
  return canvas.toDataURL('image/jpeg', quality); // base64 string
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* ─── Component ─── */
export default function ImageUpload({
  value,
  onChange,
  storagePath,        // kept for API compat — not used (no Storage)
  label = 'Image',
  hint,
  width,              // target output width px
  height,             // target output height px
  maxMB = 20,         // accept up to 20 MB (we compress before saving)
}) {
  const inputRef = useRef();

  const [rawSrc, setRawSrc]         = useState(null);
  const [crop, setCrop]             = useState({ x: 0, y: 0 });
  const [zoom, setZoom]             = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError]           = useState('');
  const [done, setDone]             = useState(false);

  const aspect = (width && height) ? width / height : 16 / 9;
  const dimensionHint = hint || (width && height ? `${width} × ${height} px` : null);

  /* File chosen → read to dataURL, open crop dialog */
  const handleFile = (file) => {
    if (!file) return;
    setError(''); setDone(false);
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB — max ${maxMB} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setRawSrc(reader.result); setCrop({ x: 0, y: 0 }); setZoom(1); };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_, areaPixels) => setCroppedArea(areaPixels), []);

  /* Crop → compress → base64 → call onChange (no upload needed) */
  const handleCropDone = async () => {
    if (!croppedArea) return;
    setProcessing(true);
    try {
      const outW = width  ? Math.min(width,  1200) : Math.min(croppedArea.width,  900);
      const outH = width && height ? Math.round(outW * (height / width)) : Math.min(croppedArea.height, 900);

      const base64 = await getCroppedBase64(rawSrc, croppedArea, outW, outH, 0.82);

      // Size check — Firestore docs support up to ~1 MB per field
      const sizeKB = Math.round((base64.length * 3) / 4 / 1024);
      if (sizeKB > 900) {
        // Re-compress harder
        const base64Low = await getCroppedBase64(rawSrc, croppedArea, outW, outH, 0.6);
        onChange(base64Low);
      } else {
        onChange(base64);
      }

      setRawSrc(null);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      setError('Could not process image: ' + e.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

  return (
    <div className="img-upload-wrapper">
      {label && <label className="img-upload-label">{label}</label>}

      {/* Hint */}
      {(dimensionHint) && (
        <div className="img-upload-hint">
          <Crop size={12} />
          {dimensionHint && <span>Output: <strong>{dimensionHint}</strong></span>}
          <span>· <strong>Any size/resolution accepted</strong> — crop inside</span>
          <span>· No upload needed — stored free</span>
        </div>
      )}

      {/* ── Crop Modal ── */}
      {rawSrc && (
        <div className="img-crop-overlay">
          <div className="img-crop-modal">
            <div className="img-crop-header">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                <Crop size={15} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                Crop &amp; Fit
                {dimensionHint && (
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                    → {dimensionHint}
                  </span>
                )}
              </span>
              {!processing && (
                <button onClick={() => setRawSrc(null)} className="img-crop-close"><X size={17} /></button>
              )}
            </div>

            {/* Cropper */}
            <div className="img-crop-area">
              <Cropper
                image={rawSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid
                style={{
                  containerStyle: { background: '#0a0a0a' },
                  cropAreaStyle: { border: '2px solid var(--accent)', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' },
                }}
              />
            </div>

            {/* Zoom */}
            <div className="img-crop-controls">
              <ZoomOut size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <input type="range" min={1} max={3} step={0.05}
                value={zoom} onChange={e => setZoom(Number(e.target.value))}
                className="img-crop-slider" />
              <ZoomIn size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '34px' }}>
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {error && (
              <div className="img-upload-status error" style={{ margin: '0 1.2rem 0.5rem' }}>
                <AlertCircle size={13} /> {error}
              </div>
            )}

            {/* Processing indicator */}
            {processing && (
              <div style={{ padding: '0 1.2rem 0.5rem', textAlign: 'center' }}>
                <div className="img-upload-progress-bar-wrapper">
                  <div className="img-upload-progress-bar img-progress-pulse" />
                </div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Compressing image…
                </p>
              </div>
            )}

            <div className="img-crop-footer">
              <button onClick={() => setRawSrc(null)} className="btn btn-outline" disabled={processing}>
                Cancel
              </button>
              <button onClick={handleCropDone} className="btn btn-primary" disabled={processing}>
                {processing
                  ? 'Processing…'
                  : <><Crop size={14} style={{ marginRight: '0.35rem' }} />Crop &amp; Save</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drop Zone ── */}
      <div
        className={`img-upload-dropzone ${value ? 'has-image' : ''}`}
        onClick={() => !rawSrc && inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {value ? (
          <div className="img-upload-preview">
            <img src={value} alt="Uploaded" className="img-upload-thumb" />
            <div className="img-upload-preview-overlay">
              <button type="button" className="img-upload-change-btn"
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
                <Upload size={14} /> Change
              </button>
              <button type="button" className="img-upload-remove-btn"
                onClick={e => { e.stopPropagation(); onChange(''); setDone(false); setError(''); }}>
                <X size={14} /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="img-upload-placeholder">
            <Upload size={28} className="img-upload-icon" />
            <p className="img-upload-main-text">Click or drag &amp; drop</p>
            <p className="img-upload-sub-text">Any size — crop &amp; compress inside. 100% free.</p>
            {dimensionHint && <p className="img-upload-sub-text" style={{ marginTop: '0.2rem' }}>Output: <strong>{dimensionHint}</strong></p>}
          </div>
        )}
      </div>

      {done && (
        <div className="img-upload-status success">
          <CheckCircle size={13} /> Image saved!
        </div>
      )}
      {!rawSrc && error && (
        <div className="img-upload-status error">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <input ref={inputRef} type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { handleFile(e.target.files[0]); e.target.value = ''; }} />
    </div>
  );
}
