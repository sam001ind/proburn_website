import './Hero.css';
import { ArrowRight } from 'lucide-react';
import BoomerangVideoBg from './BoomerangVideoBg';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const defaults = {
  title: 'FORGE YOUR LEGACY',
  titleHighlight: 'LEGACY',
  subtitle: 'Join the elite. Push your limits. Transform your life at Proburn Fitness with state-of-the-art equipment and expert coaching.',
  ctaPrimary: 'Start Free Trial',
  ctaSecondary: 'View Classes',
};

export default function Hero() {
  const [data, setData] = useState(defaults);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'homepage', 'hero'), (snap) => {
      if (snap.exists()) setData({ ...defaults, ...snap.data() });
    });
    return () => unsub();
  }, []);

  const { title, titleHighlight, subtitle, ctaPrimary, ctaSecondary } = data;
  const parts = titleHighlight ? title.split(titleHighlight) : [title];

  if (data.visible === false) return null;

  return (
    <section id="home" className="hero-section">
      <BoomerangVideoBg src={`${import.meta.env.BASE_URL}gym-bg.mp4`} />
      <div className="hero-overlay"></div>
      <div className="container hero-content animate-fade-in">
        <div className="hero-text">
          <h1 className="hero-title">
            {parts[0]}<span className="text-gradient">{titleHighlight}</span>{parts[1] || ''}
          </h1>
          <p className="hero-subtitle">{subtitle}</p>
          <div className="hero-cta-group">
            <button className="btn btn-primary">
              {ctaPrimary} <ArrowRight size={20} style={{marginLeft: '8px'}} />
            </button>
            <button className="btn btn-outline">{ctaSecondary}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
