import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "gym-mis-app-2026-v2",
  appId: "1:495058841818:web:b4e9752031d9f8eadf75e3",
  storageBucket: "gym-mis-app-2026-v2.firebasestorage.app",
  apiKey: "AIzaSyCQYhGggj3pUqhj_vd_yYCYBveNShN8dhw",
  authDomain: "gym-mis-app-2026-v2.firebaseapp.com",
  messagingSenderId: "495058841818"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Secondary app instance for creating users without logging out the primary session
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
export const secondaryAuth = getAuth(secondaryApp);
