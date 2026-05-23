import { MapPin, Phone, Mail } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer bg-alt">
      <div className="container footer-content">
        <div className="footer-brand">
          <h2>PRO<span className="text-accent">BURN</span></h2>
          <p className="footer-desc">
            Forging champions since 2024. Your ultimate destination for strength, conditioning, and transformation.
          </p>
          <div className="social-links">
            <a href="#" className="social-icon">IG</a>
            <a href="#" className="social-icon">FB</a>
            <a href="#" className="social-icon">X</a>
          </div>
        </div>

        <div className="footer-links">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#classes">Classes</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h3>Contact Us</h3>
          <ul>
            <li><MapPin size={18} className="text-accent" /> 123 Muscle Ave, Fit City, FC 90210</li>
            <li><Phone size={18} className="text-accent" /> (555) 123-4567</li>
            <li><Mail size={18} className="text-accent" /> info@proburnfitness.com</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Proburn Fitness. All rights reserved.</p>
      </div>
    </footer>
  );
}
