import { Shield, Zap, Users, Trophy, Star, Heart, Target, Award } from 'lucide-react';
import './Features.css';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const ICON_MAP = { Zap, Shield, Users, Trophy, Star, Heart, Target, Award };

const defaults = {
  sectionTitle: 'Why Choose',
  sectionTitleHighlight: 'Proburn',
  subtitle: "We don't just offer equipment; we provide an environment engineered for success and transformation.",
  features: [
    { icon: 'Zap', title: 'High-Intensity Training', description: 'Push your limits with our scientifically designed HIIT and strength programs.' },
    { icon: 'Shield', title: 'Premium Equipment', description: 'Train with the best. Our facility is equipped with state-of-the-art rogue gear.' },
    { icon: 'Users', title: 'Elite Coaching', description: 'Learn from certified professionals dedicated to your personal growth.' },
    { icon: 'Trophy', title: 'Proven Results', description: 'Join a community of champions. Your success is our ultimate goal.' },
  ]
};

export default function Features() {
  const [data, setData] = useState(defaults);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'homepage', 'features'), (snap) => {
      if (snap.exists()) setData({ ...defaults, ...snap.data() });
    });
    return () => unsub();
  }, []);

  const { sectionTitle, sectionTitleHighlight, subtitle, features } = data;
  const parts = sectionTitleHighlight ? sectionTitle.split(sectionTitleHighlight) : [sectionTitle];

  if (data.visible === false) return null;

  return (
    <section id="about" className="section-padding">
      <div className="container">
        <h2 className="section-title">
          {parts[0]}<span className="text-accent">{sectionTitleHighlight}</span>{parts[1] || ''}
        </h2>
        <p className="section-subtitle">{subtitle}</p>
        <div className="features-grid">
          {features.map((feature, index) => {
            const IconComp = ICON_MAP[feature.icon] || Zap;
            return (
              <div key={index} className="glass-card feature-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="feature-icon"><IconComp size={40} className="text-accent" /></div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
