import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const TenantContext = createContext();

export function useTenant() {
  return useContext(TenantContext);
}

export function TenantProvider({ children }) {
  const [activeGymId, setActiveGymId] = useState(null);
  const [activeGymData, setActiveGymData] = useState(null);

  // This function will be used later when parsing the URL on public routes
  // or after a user logs in and their user document provides a gymId
  const setTenant = (gymId) => {
    setActiveGymId(gymId);
  };

  useEffect(() => {
    const checkCustomDomain = async () => {
      const hostname = window.location.hostname;
      
      // Ignore localhost, our main dev environments, or explicit IP addresses
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('firebaseapp.com') || hostname.includes('web.app')) {
        return; 
      }

      try {
        const q = query(collection(db, 'gyms'), where('customDomain', '==', hostname));
        const snap = await getDocs(q);
        if (!snap.empty) {
          // A gym matched this custom domain!
          setActiveGymId(snap.docs[0].id);
        }
      } catch (err) {
        console.error("Error checking custom domain:", err);
      }
    };
    checkCustomDomain();
  }, []);

  useEffect(() => {
    if (!activeGymId) {
      setActiveGymData(null);
      return;
    }

    const unsubGym = onSnapshot(query(collection(db, 'gyms'), where('__name__', '==', activeGymId)), (snap) => {
      if (!snap.empty) {
        setActiveGymData({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setActiveGymData(null);
      }
    });

    const unsubTheme = onSnapshot(doc(db, 'website_settings', `${activeGymId}_theme`), (snap) => {
      if (snap.exists()) {
        const themeData = snap.data();
        const root = document.documentElement;
        if (themeData.primaryColor) root.style.setProperty('--accent', themeData.primaryColor);
        if (themeData.bgColor) root.style.setProperty('--bg', themeData.bgColor);
        if (themeData.surfaceColor) root.style.setProperty('--surface', themeData.surfaceColor);
      }
    });

    return () => { unsubGym(); unsubTheme(); };
  }, [activeGymId]);

  return (
    <TenantContext.Provider value={{ activeGymId, activeGymData, setTenant }}>
      {children}
    </TenantContext.Provider>
  );
}
