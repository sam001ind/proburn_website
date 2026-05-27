import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, setDoc, deleteDoc, doc } from "firebase/firestore";

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
  const snap = await getDocs(collection(db, 'website_settings'));
  for (const d of snap.docs) {
    if (d.id === 'theme' || d.id === 'navigation') {
      const data = d.data();
      const newId = `${data.gymId || 'proburn'}_${d.id}`;
      await setDoc(doc(db, 'website_settings', newId), { ...data, type: d.id });
      await deleteDoc(d.ref);
    }
  }
  console.log("Fixed website settings doc IDs.");
  process.exit(0);
};

run().catch(console.error);
