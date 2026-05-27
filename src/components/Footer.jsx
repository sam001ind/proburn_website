import { MapPin, Phone, Mail } from 'lucide-react';
import './Footer.css';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useTenant } from '../context/TenantContext';

const defaults = {
  gymName: 'PROBURN',
  gymNameHighlight: 'BURN',
  tagline: 'Forging champions since 2024. Your ultimate destination for strength, conditioning, and transformation.',
  address: '123 Muscle Ave, Fit City, FC 90210',
  phone: '(555) 123-4567',
  email: 'info@proburnfitness.com',
  instagramUrl: '#',
  facebookUrl: '#',
  twitterUrl: '#',
  copyrightName: 'Proburn Fitness',
  logoURL: '',
};

export default function Footer() {
  const { activeGymId, activeGymData } = useTenant();
  const [data, setData] = useState(defaults);
  const [navLinks, setNavLinks] = useState([
    { label: 'Home', path: '/' },
    { label: 'Classes', path: '/classes' },
    { label: 'Pricing', path: '/pricing' }
  ]);

  useEffect(() => {
    if (!activeGymId) return;

    // Read contact from homepage/contact
    const unsubContact = onSnapshot(doc(db, 'homepage', 'contact'), (snap) => {
      if (snap.exists()) setData(d => ({ ...d, ...snap.data() }));
    });
    // Override gym name / logo from active branch (scoped to gymId)
    const unsubBranch = onSnapshot(query(collection(db, 'branches'), where('gymId', '==', activeGymId)), (snap) => {
      if (!snap.empty) {
        const match = snap.docs[0];
        if (match) {
          const b = match.data();
          setData(d => ({
            ...d,
            gymName: b.gymName || d.gymName,
            gymNameHighlight: b.gymNameHighlight || d.gymNameHighlight,
            tagline: b.tagline || d.tagline,
            address: b.address || d.address,
            phone: b.phone || d.phone,
            email: b.email || d.email,
            instagramUrl: b.instagramUrl || d.instagramUrl,
            facebookUrl: b.facebookUrl || d.facebookUrl,
            twitterUrl: b.twitterUrl || d.twitterUrl,
            copyrightName: b.gymName || d.copyrightName,
            logoURL: b.logoURL || '',
          }));
        }
      }
    });

    const unsubNav = onSnapshot(doc(db, 'website_settings', `${activeGymId}_navigation`), (snap) => {
      if (snap.exists() && snap.data().links) {
        setNavLinks(snap.data().links);
      }
    });

    const unsubTheme = onSnapshot(doc(db, 'website_settings', 'theme'), (snap) => {
      if (snap.exists()) {
        const themeData = snap.data();
        setData(d => ({
          ...d,
          gymName: themeData.logoText || d.gymName,
          gymNameHighlight: themeData.logoHighlight || '',
          logoURL: themeData.logoUrl || d.logoURL,
        }));
      }
    });

    return () => { unsubContact(); unsubBranch(); unsubNav(); unsubTheme(); };
  }, []);

  const { gymName, gymNameHighlight, tagline, address, phone, email, instagramUrl, facebookUrl, twitterUrl, copyrightName, logoURL } = data;
  const parts = gymNameHighlight ? gymName.split(gymNameHighlight) : [gymName, ''];

  return (
    <footer className="footer bg-alt">
      <div className="container footer-content">
        <div className="footer-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.5rem' }}>
            {logoURL
              ? <img src={logoURL} alt="logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
              : null
            }
            <h2 style={{ margin: 0 }}>{parts[0]}<span className="text-accent">{gymNameHighlight}</span>{parts[1] || ''}</h2>
          </div>
          <p className="footer-desc">{tagline}</p>
          <div className="social-links">
            <a href={instagramUrl} className="social-icon" target="_blank" rel="noreferrer">IG</a>
            <a href={facebookUrl} className="social-icon" target="_blank" rel="noreferrer">FB</a>
            <a href={twitterUrl} className="social-icon" target="_blank" rel="noreferrer">X</a>
          </div>
        </div>

        <div className="footer-links">
          <h3>Quick Links</h3>
            <ul className="footer-links">
              {navLinks.map((link, idx) => {
                const href = link.isExternal ? link.path : `/${activeGymId}${link.path === '/' ? '' : link.path}`;
                return (
                  <li key={idx}>
                    <a href={href} target={link.isExternal ? '_blank' : '_self'} rel={link.isExternal ? 'noreferrer' : ''}>
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
        </div>

        <div className="footer-contact">
          <h3>Contact Us</h3>
          <ul>
            <li><MapPin size={18} className="text-accent" /> {address}</li>
            <li><Phone size={18} className="text-accent" /> {phone}</li>
            <li><Mail size={18} className="text-accent" /> {email}</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {copyrightName}. All rights reserved.</p>
      </div>
    </footer>
  );
}
