import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
const firebaseConfigStr = fs.readFileSync('src/firebase.js', 'utf8').match(/const firebaseConfig = ({[^}]*});/)[1];
const firebaseConfig = eval('(' + firebaseConfigStr + ')');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
getDocs(collection(db, 'gyms')).then(snap => {
  snap.forEach(doc => console.log(doc.id, doc.data().slug));
  process.exit(0);
});
