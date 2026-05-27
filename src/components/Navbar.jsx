import { Dumbbell, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useTenant } from '../context/TenantContext';
import './Navbar.css';

const DEFAULTS = {
  gymName: 'PROBURN',
  gymNameHighlight: 'BURN',
  logoURL: '',
  showIcon: true,
  ctaLabel: 'Join Now',
  portalLoginLabel: 'Portal Login',
  navLinks: [
    { label: 'Home',    href: '/#home' },
    { label: 'About',   href: '/#about' },
    { label: 'Classes', href: '/#classes' },
    { label: 'Pricing', href: '/#pricing' },
  ],
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [branding, setBranding] = useState(DEFAULTS);
  const { activeGymId, activeGymData } = useTenant();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fetch Theme and Navigation from CMS
  useEffect(() => {
    if (!activeGymId) return;
    const unsubTheme = onSnapshot(doc(db, 'website_settings', `${activeGymId}_theme`), (snap) => {
      if (snap.exists()) {
        const themeData = snap.data();
        setBranding(prev => ({
          ...prev,
          gymName: themeData.logoText || prev.gymName,
          gymNameHighlight: themeData.logoHighlight || '',
          logoURL: themeData.logoUrl || prev.logoURL,
        }));
      }
    });

    const unsubNav = onSnapshot(doc(db, 'website_settings', `${activeGymId}_navigation`), (snap) => {
      if (snap.exists() && snap.data().links) {
        setBranding(prev => ({ ...prev, navLinks: snap.data().links }));
      }
    });

    return () => { unsubTheme(); unsubNav(); };
  }, [activeGymId]);

  const {
    gymName, gymNameHighlight, logoURL, showIcon,
    ctaLabel, portalLoginLabel, navLinks,
  } = branding;

  const parts = gymNameHighlight ? gymName.split(gymNameHighlight) : [gymName, ''];

  return (
    <nav className={`navbar ${scrolled ? 'glass-card scrolled' : ''}`}>
      <div className="navbar-container container">

        {/* ── Brand ── */}
        <a href="#" className="navbar-logo">
          {logoURL
            ? <img src={logoURL} alt="logo" style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover' }} />
            : (showIcon !== false && <Dumbbell className="text-accent" size={32} />)
          }
          <span>{parts[0]}<span className="text-accent">{gymNameHighlight}</span>{parts[1] || ''}</span>
        </a>

        {/* ── Links ── */}
        <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
          {navLinks.map((link, i) => {
            const href = link.isExternal ? link.path : `/${activeGymId}${link.path === '/' ? '' : link.path}`;
            return (
              <a 
                key={i} 
                href={href}
                className="nav-link"
                target={link.isExternal ? '_blank' : '_self'}
                rel={link.isExternal ? 'noreferrer' : ''}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            );
          })}
          <Link to="/login" className="nav-link text-accent" onClick={() => setIsOpen(false)}>
            {portalLoginLabel || 'Portal Login'}
          </Link>
          <button className="btn btn-primary nav-cta">{ctaLabel}</button>
        </div>

        <button className="mobile-menu-icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
    </nav>
  );
}
