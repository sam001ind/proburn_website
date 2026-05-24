import './Classes.css';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const defaults = {
  sectionTitle: 'Our',
  sectionTitleHighlight: 'Programs',
  subtitle: 'Find the perfect training program to match your goals and schedule.',
  classes: [
    { name: 'CrossFit WOD', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop', time: 'Mon, Wed, Fri - 6:00 AM' },
    { name: 'Powerlifting', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop', time: 'Tue, Thu - 5:30 PM' },
  ]
};

export default function Classes() {
  const [data, setData] = useState(defaults);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'homepage', 'classes'), (snap) => {
      if (snap.exists()) setData({ ...defaults, ...snap.data() });
    });
    return () => unsub();
  }, []);

  const { sectionTitle, sectionTitleHighlight, subtitle, classes } = data;
  const parts = sectionTitleHighlight ? sectionTitle.split(sectionTitleHighlight) : [sectionTitle];

  if (data.visible === false) return null;

  return (
    <section id="classes" className="section-padding bg-alt">
      <div className="container">
        <h2 className="section-title">
          {parts[0]}<span className="text-accent">{sectionTitleHighlight}</span>{parts[1] || ''}
        </h2>
        <p className="section-subtitle">{subtitle}</p>
        <div className="classes-grid">
          {classes.map((cls, idx) => (
            <div key={idx} className="class-card">
              <div className="class-image-wrapper">
                <img src={cls.image} alt={cls.name} className="class-image" />
                <div className="class-overlay">
                  <button className="btn btn-primary">Book Now</button>
                </div>
              </div>
              <div className="class-info">
                <h3>{cls.name}</h3>
                <p className="text-accent">{cls.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
