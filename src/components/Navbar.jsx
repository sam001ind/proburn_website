import { Dumbbell, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import './Navbar.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'glass-card scrolled' : ''}`}>
      <div className="navbar-container container">
        <a href="#" className="navbar-logo">
          <Dumbbell className="text-accent" size={32} />
          <span>PRO<span className="text-accent">BURN</span></span>
        </a>
        
        <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <a href="#home" onClick={() => setIsOpen(false)}>Home</a>
          <a href="#about" onClick={() => setIsOpen(false)}>About</a>
          <a href="#classes" onClick={() => setIsOpen(false)}>Classes</a>
          <a href="#pricing" onClick={() => setIsOpen(false)}>Pricing</a>
          <button className="btn btn-primary nav-cta">Join Now</button>
        </div>

        <button className="mobile-menu-icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
    </nav>
  );
}
