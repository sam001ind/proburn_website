import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Capacitor } from '@capacitor/core';
import { useTenant } from '../context/TenantContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const getSectionStyle = (data, defaultBg = 'var(--bg)') => {
  let background = defaultBg;
  let color = 'inherit';
  
  if (data.themeStyle === 'default') background = 'var(--bg)';
  if (data.themeStyle === 'surface') background = 'var(--surface)';
  if (data.themeStyle === 'accent') {
    background = 'var(--accent)';
    color = '#ffffff';
  }
  if (data.themeStyle === 'image' && data.themeImage) {
    background = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${data.themeImage}) center/cover`;
    color = '#ffffff';
  }
  
  return { background, color, transition: 'all 0.3s' };
};

// Dynamic Block Components
const HeroBlock = ({ data }) => (
  <section style={{ 
    minHeight: '80vh', 
    display: 'flex', 
    alignItems: 'center',
    padding: '2rem',
    ...getSectionStyle(data, data.image ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${data.image}) center/cover` : 'var(--bg)')
  }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent)' }}>{data.title}</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.9, maxWidth: '600px' }}>{data.subtitle}</p>
      {data.buttonText && (
        <a href={data.buttonLink} className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
          {data.buttonText}
        </a>
      )}
    </div>
  </section>
);

const TextImageBlock = ({ data }) => (
  <section style={{ padding: '4rem 2rem', ...getSectionStyle(data, 'var(--surface)') }}>
    <div style={{ 
      maxWidth: '1200px', margin: '0 auto', 
      display: 'grid', gap: '3rem', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      alignItems: 'center'
    }}>
      <div style={{ order: data.imagePosition === 'left' ? 2 : 1 }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'var(--accent)' }}>{data.title}</h2>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.6, opacity: 0.8 }}>{data.text}</p>
      </div>
      {data.image && (
        <div style={{ order: data.imagePosition === 'left' ? 1 : 2 }}>
          <img src={data.image} alt={data.title} style={{ width: '100%', borderRadius: '12px' }} />
        </div>
      )}
    </div>
  </section>
);

const FeaturesGridBlock = ({ data }) => (
  <section style={{ padding: '4rem 2rem', ...getSectionStyle(data, 'var(--bg)') }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: 'var(--accent)' }}>{data.title}</h2>
      <div style={{ 
        display: 'grid', gap: '2rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
      }}>
        {(data.items || []).map((item, idx) => (
          <div key={idx} className="card" style={{ padding: '2rem', textAlign: 'center', transition: 'transform 0.3s' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>{item.title}</h3>
            <p style={{ opacity: 0.7, lineHeight: 1.5 }}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const RichTextBlock = ({ data }) => (
  <section style={{ padding: '4rem 2rem', ...getSectionStyle(data, 'var(--bg)') }}>
    <div 
      style={{ maxWidth: '800px', margin: '0 auto', lineHeight: 1.8 }}
      dangerouslySetInnerHTML={{ __html: data.content }}
    />
  </section>
);

const PricingBlock = ({ data }) => (
  <section style={{ padding: '4rem 2rem', ...getSectionStyle(data, 'var(--surface)') }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>{data.title}</h2>
        {data.subtitle && <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>{data.subtitle}</p>}
      </div>
      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {(data.items || []).map((plan, idx) => (
          <div key={idx} className="card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{plan.title}</h3>
            <div style={{ fontSize: '3rem', fontWeight: 700, margin: '1rem 0', color: 'var(--accent)' }}>
              ${plan.price}<span style={{ fontSize: '1rem', opacity: 0.6, fontWeight: 400 }}>/{plan.duration}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '1.5rem 0', flex: 1 }}>
              {(plan.features || '').split(',').map((f, i) => (
                <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{f.trim()}</li>
              ))}
            </ul>
            {plan.buttonText && (
              <a href={plan.buttonLink} className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }}>
                {plan.buttonText}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ScheduleBlock = ({ data }) => (
  <section style={{ padding: '4rem 2rem', ...getSectionStyle(data, 'var(--bg)') }}>
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>{data.title}</h2>
        {data.subtitle && <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>{data.subtitle}</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {(data.items || []).map((cls, idx) => (
          <div key={idx} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent)' }}>{cls.time}</div>
            <div style={{ fontSize: '1.2rem', flex: 1, minWidth: '200px' }}>{cls.className}</div>
            <div style={{ opacity: 0.8 }}>Trainer: {cls.trainer}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ContactBlock = ({ data }) => (
  <section style={{ padding: '4rem 2rem', ...getSectionStyle(data, 'var(--surface)') }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '3rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <div>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>{data.title}</h2>
        {data.subtitle && <p style={{ fontSize: '1.1rem', opacity: 0.8, marginBottom: '2rem' }}>{data.subtitle}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1.1rem' }}>
          {data.email && <div><strong>Email:</strong> {data.email}</div>}
          {data.phone && <div><strong>Phone:</strong> {data.phone}</div>}
          {data.address && <div><strong>Address:</strong> {data.address}</div>}
        </div>
      </div>
      {data.mapUrl && (
        <div style={{ height: '300px', borderRadius: '12px', overflow: 'hidden' }}>
          <iframe src={data.mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"></iframe>
        </div>
      )}
    </div>
  </section>
);

const TestimonialsBlock = ({ data }) => (
  <section style={{ padding: '4rem 2rem', ...getSectionStyle(data, 'var(--bg)') }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: 'var(--accent)' }}>{data.title}</h2>
      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {(data.items || []).map((review, idx) => (
          <div key={idx} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '4px', color: '#f1c40f' }}>
              {[...Array(parseInt(review.rating) || 5)].map((_, i) => <span key={i}>★</span>)}
            </div>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, fontStyle: 'italic', flex: 1 }}>"{review.review}"</p>
            <div style={{ fontWeight: 600, color: 'var(--accent)' }}>- {review.name}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CarouselBlock = ({ data }) => {
  const [current, setCurrent] = useState(0);
  const images = (data.images || []).filter(Boolean);
  if (images.length === 0) return null;
  return (
    <section style={{ padding: '2rem', textAlign: 'center', ...getSectionStyle(data, 'var(--bg)') }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
        <img src={images[current]} alt="carousel" style={{ width: '100%', maxHeight: '600px', objectFit: 'cover', display: 'block' }} />
        {images.length > 1 && (
          <>
            <button onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.5rem' }}>‹</button>
            <button onClick={() => setCurrent((c) => (c + 1) % images.length)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.5rem' }}>›</button>
          </>
        )}
      </div>
    </section>
  );
};

const YoutubeBlock = ({ data }) => {
  let embedUrl = data.url;
  if (embedUrl && embedUrl.includes('watch?v=')) {
    embedUrl = embedUrl.replace('watch?v=', 'embed/');
  }
  return (
    <section style={{ padding: '4rem 2rem', ...getSectionStyle(data, 'var(--bg)') }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden' }}>
        {embedUrl ? (
          <iframe width="100%" height="100%" src={embedUrl} title="YouTube video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Video URL Provided</div>
        )}
      </div>
    </section>
  );
};

const FaqBlock = ({ data }) => {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <section style={{ padding: '4rem 2rem', background: 'var(--surface)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {data.title && <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: 'var(--accent)' }}>{data.title}</h2>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(data.items || []).map((item, idx) => (
            <div key={idx} className="card" style={{ overflow: 'hidden' }}>
              <button 
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                style={{ width: '100%', padding: '1.5rem', background: 'transparent', border: 'none', color: 'white', textAlign: 'left', fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                {item.question}
                <span>{openIdx === idx ? '−' : '+'}</span>
              </button>
              {openIdx === idx && (
                <div style={{ padding: '0 1.5rem 1.5rem', opacity: 0.8, lineHeight: 1.6 }}>
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const DividerBlock = ({ data }) => {
  const styleMap = {
    solid: '1px solid rgba(255,255,255,0.1)',
    dashed: '1px dashed rgba(255,255,255,0.2)',
    invisible: 'none'
  };
  return (
    <div style={{ padding: `${data.padding || '2rem'} 0`, ...getSectionStyle(data, 'var(--bg)') }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', borderBottom: styleMap[data.style] || styleMap.solid }}></div>
    </div>
  );
};

const ButtonBlock = ({ data }) => {
  return (
    <section style={{ padding: '2rem', textAlign: data.align || 'center', ...getSectionStyle(data, 'var(--bg)') }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <a href={data.link || '#'} className={`btn ${data.style === 'secondary' ? 'btn-outline' : 'btn-primary'}`} style={{ display: 'inline-block', padding: '1rem 2rem', fontSize: '1.1rem' }}>
          {data.text || 'Button'}
        </a>
      </div>
    </section>
  );
};

const MultiColumnBlock = ({ data }) => {
  const items = data.items || [];
  const cols = items.length || 1;
  return (
    <section style={{ padding: '4rem 2rem', ...getSectionStyle(data, 'var(--surface)') }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: `repeat(auto-fit, minmax(${100/cols - 10}%, 1fr))` }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
              {item.image && <img src={item.image} alt={item.title} style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />}
              {item.title && <h3 style={{ fontSize: '1.5rem', color: 'var(--accent)', margin: 0 }}>{item.title}</h3>}
              {item.text && <p style={{ opacity: 0.8, lineHeight: 1.6, margin: 0 }}>{item.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const BLOCK_COMPONENTS = {
  hero: HeroBlock,
  textImage: TextImageBlock,
  featuresGrid: FeaturesGridBlock,
  richText: RichTextBlock,
  pricing: PricingBlock,
  schedule: ScheduleBlock,
  contact: ContactBlock,
  testimonials: TestimonialsBlock,
  carousel: CarouselBlock,
  youtube: YoutubeBlock,
  faq: FaqBlock,
  divider: DividerBlock,
  button: ButtonBlock,
  multicolumn: MultiColumnBlock
};

export default function DynamicPage({ isHome = false }) {
  const { gymSlug, pageSlug } = useParams();
  const { activeGymId, setTenant } = useTenant();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect to login if on native app since native apps don't use website pages
  if (Capacitor.isNativePlatform()) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (gymSlug && gymSlug !== activeGymId) {
      setTenant(gymSlug);
    }
  }, [gymSlug, activeGymId, setTenant]);

  useEffect(() => {
    const fetchPage = async () => {
      if (!activeGymId) return; // Wait until tenant is resolved
      try {
        setLoading(true);
        const pagesRef = collection(db, 'website_pages');
        let q;
        if (isHome) {
          q = query(pagesRef, where('gymId', '==', activeGymId), where('isHome', '==', true), limit(1));
        } else if (pageSlug) {
          q = query(pagesRef, where('gymId', '==', activeGymId), where('slug', '==', pageSlug), limit(1));
        }
        
        if (q) {
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            setPageData(snapshot.docs[0].data());
          }
        }
      } catch (err) {
        console.error("Error fetching page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [isHome, pageSlug, activeGymId]);

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  // Fallback to old components if no page exists in DB (for backward compatibility during migration)
  if (!pageData) {
    if (isHome) {
      return (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h2>Homepage not configured</h2>
          <p>Please log into the Admin panel and set a page as Homepage in the Website Builder.</p>
          <Link to={`/${gymSlug}/login`} style={{ display: 'inline-block', marginTop: '1rem', padding: '0.8rem 1.5rem', background: 'var(--accent)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
            Go to Admin Login
          </Link>
        </div>
      );
    }
    return <div style={{ textAlign: 'center', padding: '4rem' }}><h2>404 - Page Not Found</h2></div>;
  }

  const sections = pageData.sections || [];

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '80vh' }}>
        {sections.map(section => {
          const BlockComponent = BLOCK_COMPONENTS[section.type];
          if (!BlockComponent) return null;
          return <BlockComponent key={section.id} data={section.data} />;
        })}
      </div>
      <Footer />
    </>
  );
}
