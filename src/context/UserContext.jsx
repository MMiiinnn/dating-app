import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = localStorage.getItem('datingAppUid');
    if (!uid) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          setCurrentUser({ id: userDoc.id, ...userDoc.data() });
        } else {
          localStorage.removeItem('datingAppUid');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        localStorage.removeItem('datingAppUid');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const switchAccount = useCallback(() => {
    localStorage.removeItem('datingAppUid');
    setCurrentUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, loading, switchAccount }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
