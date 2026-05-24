import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './CustomSections.css';

export default function CustomSections() {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'homepage_sections'), snap => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.visible !== false)
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      setSections(data);
    });
    return () => unsub();
  }, []);

  if (!sections.length) return null;

  return (
    <>
      {sections.map(section => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </>
  );
}

function SectionRenderer({ section }) {
  const { type, title, titleHighlight, subtitle } = section;
  const parts = titleHighlight && title ? title.split(titleHighlight) : [title, ''];

  const Header = () => (title || subtitle) ? (
    <div className="cs-header">
      {title && (
        <h2 className="cs-title">
          {parts[0]}<span className="cs-highlight">{titleHighlight}</span>{parts[1] || ''}
        </h2>
      )}
      {subtitle && <p className="cs-subtitle">{subtitle}</p>}
    </div>
  ) : null;

  if (type === 'text') return (
    <section className="cs-section">
      <div className="container">
        <Header />
        {section.body && <p className="cs-body">{section.body}</p>}
      </div>
    </section>
  );

  if (type === 'cards') return (
    <section className="cs-section">
      <div className="container">
        <Header />
        <div className="cs-cards-grid">
          {(section.items || []).map((card, i) => (
            <div key={i} className="cs-card glass-panel">
              {card.icon && <div className="cs-card-icon">{card.icon}</div>}
              {card.title && <h3 className="cs-card-title">{card.title}</h3>}
              {card.text  && <p  className="cs-card-text">{card.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  if (type === 'image_text') return (
    <section className="cs-section">
      <div className={`container cs-image-text ${section.imagePosition === 'right' ? 'reverse' : ''}`}>
        {section.imageURL && (
          <div className="cs-image-wrap">
            <img src={section.imageURL} alt={title || 'section'} className="cs-image" />
          </div>
        )}
        <div className="cs-text-wrap">
          <Header />
          {section.body && <p className="cs-body">{section.body}</p>}
        </div>
      </div>
    </section>
  );

  if (type === 'banner') return (
    <section className="cs-banner" style={section.imageURL ? { backgroundImage: `url(${section.imageURL})` } : {}}>
      <div className="cs-banner-overlay" />
      <div className="container cs-banner-content">
        <Header />
        {section.ctaLabel && (
          <a href={section.ctaLink || '#'} className="btn btn-primary cs-cta">
            {section.ctaLabel}
          </a>
        )}
      </div>
    </section>
  );

  if (type === 'faq') return (
    <section className="cs-section">
      <div className="container">
        <Header />
        <div className="cs-faq-list">
          {(section.items || []).map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  );

  return null;
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`cs-faq-item ${open ? 'open' : ''}`}>
      <button className="cs-faq-q" onClick={() => setOpen(v => !v)}>
        {q} <span className="cs-faq-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="cs-faq-a">{a}</div>}
    </div>
  );
}
