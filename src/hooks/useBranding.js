/**
 * useBranding — fetches active branch branding from Firestore
 * Returns: { gymName, gymNameHighlight, logoURL, brandColor, tagline, loading }
 *
 * Priority: first branch doc where isDefault===true, otherwise first doc.
 */
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const FALLBACK = {
  gymName:            'PROBURN',
  gymNameHighlight:   'BURN',
  logoURL:            '',
  brandColor:         '#ff4500',
  tagline:            'Ignite Your Potential',
};

export default function useBranding() {
  const [branding, setBranding] = useState({ ...FALLBACK, loading: true });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'branches'), (snap) => {
      if (snap.empty) { setBranding({ ...FALLBACK, loading: false }); return; }

      const branches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Prefer the one flagged as default, else first
      const active = branches.find(b => b.isDefault) || branches[0];

      setBranding({
        id:               active.id,
        gymName:          active.gymName          || FALLBACK.gymName,
        gymNameHighlight: active.gymNameHighlight || FALLBACK.gymNameHighlight,
        logoURL:          active.logoURL          || '',
        brandColor:       active.brandColor       || FALLBACK.brandColor,
        tagline:          active.tagline          || FALLBACK.tagline,
        branchName:       active.branchName       || active.gymName || FALLBACK.gymName,
        loading:          false,
      });
    });
    return () => unsub();
  }, []);

  return branding;
}
