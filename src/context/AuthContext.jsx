import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useTenant } from './TenantContext';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  
  const { setTenant } = useTenant();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user?.email) {
        const superAdmins = ['admin@gym.com', 'abhijiththirutheri@gmail.com'];
        if (superAdmins.includes(user.email.toLowerCase())) {
           setIsSuperAdmin(true);
           setTenant(null); // Super admin operates globally
        } else {
           setIsSuperAdmin(false);
           const q = query(collection(db, 'members'), where('email', '==', user.email));
           const snap = await getDocs(q);
           if (!snap.empty) {
             const data = snap.docs[0].data();
             const gymId = data.gymId;
             if (gymId) setTenant(gymId);
             setNeedsPasswordReset(data.needsPasswordReset || false);
           } else {
             setNeedsPasswordReset(false);
           }
        }
      } else {
        setIsSuperAdmin(false);
        setTenant(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [setTenant]);

  return (
    <AuthContext.Provider value={{ currentUser, loading, isSuperAdmin, needsPasswordReset }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
