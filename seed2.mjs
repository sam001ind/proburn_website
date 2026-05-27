import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, query, where, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gym-mis-app-2026-v2",
  appId: "1:495058841818:web:b4e9752031d9f8eadf75e3",
  storageBucket: "gym-mis-app-2026-v2.firebasestorage.app",
  apiKey: "AIzaSyCQYhGggj3pUqhj_vd_yYCYBveNShN8dhw",
  authDomain: "gym-mis-app-2026-v2.firebaseapp.com",
  messagingSenderId: "495058841818"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const run = async () => {
  // Update the seeded home page to have themeStyle inside data
  const q = query(collection(db, 'website_pages'), where('isHome', '==', true));
  const snap = await getDocs(q);
  
  if (!snap.empty) {
    const docRef = snap.docs[0].ref;
    const existing = snap.docs[0].data();
    
    const newSections = existing.sections.map(sec => {
      if (sec.themeStyle) {
        return { ...sec, data: { ...sec.data, themeStyle: sec.themeStyle }, themeStyle: undefined };
      }
      return sec;
    });

    await setDoc(docRef, { ...existing, sections: newSections });
  }

  // Seed navigation
  const navRef = doc(db, 'website_settings', 'navigation');
  await setDoc(navRef, {
    links: [
      { id: '1', label: 'Home', path: '/', isExternal: false },
      { id: '2', label: 'Dashboard', path: '/admin/dashboard', isExternal: false },
      { id: '3', label: 'Join Now', path: '/login', isExternal: false }
    ]
  });

  console.log("Fixed themeStyles and seeded navigation.");
  process.exit(0);
};

run().catch(console.error);
