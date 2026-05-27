import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import crypto from 'crypto';

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
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log("Usage: node create_tenant.mjs <slug> <gymName> <adminEmail>");
    process.exit(1);
  }

  const slug = args[0];
  const gymName = args[1];
  const adminEmail = args[2];

  console.log(`Creating new tenant: ${gymName} (${slug})`);

  // 1. Create the Gym
  await setDoc(doc(db, 'gyms', slug), {
    name: gymName,
    slug: slug,
    createdAt: new Date(),
    status: "active"
  });

  // 2. Create the first Admin Member for this gym
  const memberId = 'MEM' + crypto.randomBytes(3).toString('hex').toUpperCase();
  await setDoc(doc(db, 'members', memberId), {
    gymId: slug,
    memberId: memberId,
    name: "Admin User",
    email: adminEmail,
    role: "Admin",
    status: "active",
    joinedDate: new Date().toISOString()
  });

  // 3. Create basic Theme settings
  await setDoc(doc(db, 'website_settings', `${slug}_theme`), {
    gymId: slug,
    type: 'theme',
    logoText: gymName,
    primaryColor: '#007bff',
    bgColor: '#ffffff',
    surfaceColor: '#f8f9fa'
  });

  console.log("Tenant created successfully!");
  console.log(`Public Website: /proburn_website/${slug}`);
  console.log(`Admin Login Email: ${adminEmail}`);
  process.exit(0);
};

run().catch(console.error);
