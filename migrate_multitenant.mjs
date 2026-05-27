import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";

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

const DEFAULT_GYM_ID = 'proburn';

const run = async () => {
  console.log("Starting multi-tenant migration...");

  // 1. Create the default gym document
  const gymRef = doc(db, 'gyms', DEFAULT_GYM_ID);
  await setDoc(gymRef, {
    name: "ProBurn Gym",
    slug: "proburn",
    createdAt: new Date(),
    status: "active"
  }, { merge: true });
  console.log(`Created default gym: ${DEFAULT_GYM_ID}`);

  // 2. Collections to migrate
  const collectionsToMigrate = [
    'members', 'leads', 'roles', 'branches', 
    'website_pages', 'website_settings', 'attendance', 
    'transactions', 'plans', 'holidays'
  ];

  for (const colName of collectionsToMigrate) {
    console.log(`Migrating collection: ${colName}...`);
    const snap = await getDocs(collection(db, colName));
    let updatedCount = 0;
    
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (!data.gymId) {
        await updateDoc(docSnap.ref, { gymId: DEFAULT_GYM_ID });
        updatedCount++;
      }
    }
    console.log(`  Updated ${updatedCount} documents in ${colName}.`);
  }

  console.log("Migration complete!");
  process.exit(0);
};

run().catch(console.error);
