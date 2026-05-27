import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc } from "firebase/firestore";

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
  // Clear existing home pages if any
  const q = query(collection(db, 'website_pages'), where('slug', '==', 'home'));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }

  // Create new home page with full template
  await addDoc(collection(db, 'website_pages'), {
    title: 'Home',
    slug: 'home',
    isHome: true,
    createdAt: new Date(),
    sections: [
      {
        id: 'hero-1',
        type: 'hero',
        themeStyle: 'image',
        data: {
          title: 'Unleash Your Potential',
          subtitle: 'Join PROBURN and transform your life with our state-of-the-art facilities.',
          image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
          buttonText: 'Join Now',
          buttonLink: '/login'
        }
      },
      {
        id: 'features-1',
        type: 'features',
        themeStyle: 'default',
        data: {
          title: 'Why Choose Us?',
          items: [
            { title: 'Modern Equipment', description: 'Access to the latest fitness machines.', icon: 'dumbbell' },
            { title: 'Expert Trainers', description: 'Certified professionals to guide you.', icon: 'users' },
            { title: 'Flexible Hours', description: 'Open 24/7 for your convenience.', icon: 'clock' }
          ]
        }
      },
      {
        id: 'pricing-1',
        type: 'pricing',
        themeStyle: 'surface',
        data: {
          title: 'Membership Plans',
          plans: [
            { name: 'Basic', price: '29', highlighted: false, features: ['Gym Access', 'Locker Room'] },
            { name: 'Pro', price: '49', highlighted: true, features: ['Gym Access', 'Group Classes', 'Personal Trainer'] }
          ]
        }
      },
      {
        id: 'testimonials-1',
        type: 'testimonials',
        themeStyle: 'default',
        data: {
          title: 'What Our Members Say',
          items: [
            { name: 'Sarah M.', review: 'The best gym I have ever been to! Great community.', rating: '5' },
            { name: 'John D.', review: 'Amazing equipment and the trainers are super helpful.', rating: '5' }
          ]
        }
      },
      {
        id: 'contact-1',
        type: 'contact',
        themeStyle: 'accent',
        data: {
          title: 'Ready to Start?',
          subtitle: 'Visit us today or get in touch.',
          email: 'hello@proburn.com',
          phone: '+1 234 567 8900',
          address: '123 Fitness Ave, NY',
          mapUrl: ''
        }
      }
    ]
  });

  console.log("Successfully created Home page!");
  process.exit(0);
};

run().catch(console.error);
