import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Capacitor } from '@capacitor/core';
import { useTenant } from '../context/TenantContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import { BLOCK_COMPONENTS } from '../components/website/WebsiteBlocks';

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
