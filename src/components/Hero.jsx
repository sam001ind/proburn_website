import './Hero.css';
import { ArrowRight } from 'lucide-react';
import BoomerangVideoBg from './BoomerangVideoBg';

export default function Hero() {
  return (
    <section id="home" className="hero-section">
      <BoomerangVideoBg src="/gym-bg.mp4" />
      <div className="hero-overlay"></div>
      <div className="container hero-content animate-fade-in">
        <div className="hero-text">
          <h1 className="hero-title">
            FORGE YOUR <span className="text-gradient">LEGACY</span>
          </h1>
          <p className="hero-subtitle">
            Join the elite. Push your limits. Transform your life at Proburn Fitness with state-of-the-art equipment and expert coaching.
          </p>
          <div className="hero-cta-group">
            <button className="btn btn-primary">
              Start Free Trial <ArrowRight size={20} style={{marginLeft: '8px'}} />
            </button>
            <button className="btn btn-outline">View Classes</button>
          </div>
        </div>
      </div>
    </section>
  );
}
