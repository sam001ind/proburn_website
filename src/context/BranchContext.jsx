import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const { currentUser } = useAuth();
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranchState] = useState(null);
  const [branding, setBranding] = useState(null);
  const [allowedBranchIds, setAllowedBranchIds] = useState(undefined); // undefined = loading

  // 1. Determine allowed branches
  useEffect(() => {
    if (!currentUser?.email) {
      setAllowedBranchIds(undefined); // Waiting for auth
      return;
    }
    const adminEmails = ['admin@gym.com', 'abhijiththirutheri@gmail.com'];
    if (adminEmails.includes(currentUser.email.toLowerCase())) {
      setAllowedBranchIds(null); // null = Super Admin (all branches)
      return;
    }
    
    // Fetch member doc to find assigned branchIds
    const q = query(collection(db, 'members'), where('email', '==', currentUser.email));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        if (data.role && data.role !== 'Member') {
          // Staff can have multiple branches
          setAllowedBranchIds(data.branchIds || []);
        } else {
          // Regular member has a single branchId
          setAllowedBranchIds(data.branchId ? [data.branchId] : []);
        }
      } else {
        setAllowedBranchIds([]); // Unrecognized user
      }
    });
    return () => unsub();
  }, [currentUser]);

  // 2. Load all branches and filter
  useEffect(() => {
    if (allowedBranchIds === undefined) return; // Still determining access

    const unsub = onSnapshot(collection(db, 'branches'), (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter if restricted
      if (allowedBranchIds !== null) {
        data = data.filter(b => allowedBranchIds.includes(b.id));
      }
      
      setBranches(data);

      // Restore saved branch or pick first valid
      const savedId = localStorage.getItem('activeBranchId');
      let found = data.find(b => b.id === savedId);
      if (!found) found = data.length > 0 ? data[0] : null;
      
      if (found) {
        if (!activeBranch || activeBranch.id !== found.id) {
          setActiveBranchState(found);
        }
      } else {
        setActiveBranchState(null);
      }
    });
    return () => unsub();
  }, [allowedBranchIds, activeBranch]);

  // 3. Listen to branding for the active branch
  useEffect(() => {
    if (!activeBranch?.id) {
      setBranding(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'branches', activeBranch.id), (snap) => {
      if (snap.exists()) {
        setBranding({ id: snap.id, ...snap.data() });
      }
    });
    return () => unsub();
  }, [activeBranch?.id]);

  const setActiveBranch = (branch) => {
    localStorage.setItem('activeBranchId', branch.id);
    setActiveBranchState(branch);
  };

  return (
    <BranchContext.Provider value={{ branches, activeBranch, setActiveBranch, branding }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  return useContext(BranchContext);
}
