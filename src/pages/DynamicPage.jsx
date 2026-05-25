import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Capacitor } from '@capacitor/core';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Dynamic Block Components
const HeroBlock = ({ data }) => (
  <section style={{ 
    minHeight: '80vh', 
    display: 'flex', 
    alignItems: 'center',
    background: data.image ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${data.image}) center/cover` : 'var(--bg)',
    color: 'white',
    padding: '2rem'
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
  <section style={{ padding: '4rem 2rem', background: 'var(--surface)' }}>
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
  <section style={{ padding: '4rem 2rem', background: 'var(--bg)' }}>
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
  <section style={{ padding: '4rem 2rem', background: 'var(--bg)' }}>
    <div 
      style={{ maxWidth: '800px', margin: '0 auto', lineHeight: 1.8 }}
      dangerouslySetInnerHTML={{ __html: data.content }}
    />
  </section>
);

const BLOCK_COMPONENTS = {
  hero: HeroBlock,
  textImage: TextImageBlock,
  featuresGrid: FeaturesGridBlock,
  richText: RichTextBlock
};

export default function DynamicPage({ isHome = false }) {
  const { slug } = useParams();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect to login if on native app since native apps don't use website pages
  if (Capacitor.isNativePlatform()) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const pagesRef = collection(db, 'website_pages');
        let q;
        if (isHome) {
          q = query(pagesRef, where('isHome', '==', true), limit(1));
        } else if (slug) {
          q = query(pagesRef, where('slug', '==', slug), limit(1));
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
  }, [isHome, slug]);

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  // Fallback to old components if no page exists in DB (for backward compatibility during migration)
  if (!pageData) {
    if (isHome) {
      return (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h2>Homepage not configured</h2>
          <p>Please log into the Admin panel and set a page as Homepage in the Website Builder.</p>
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
