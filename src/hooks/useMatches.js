import { useEffect, useState } from 'react';
import { listenForMatches } from '../firebase/firestore';

/**
 * Real-time matches hook.
 * Subscribes to Firestore /matches where userIds array-contains uid.
 * Cleans up the onSnapshot listener on unmount.
 *
 * @param {string | null} uid
 * @returns {{ matches: Array, loading: boolean }}
 */
export function useMatches(uid) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = listenForMatches(uid, (newMatches) => {
      setMatches(newMatches);
      setLoading(false);
    });

    // Cleanup listener on unmount or uid change
    return () => unsubscribe();
  }, [uid]);

  return { matches, loading };
}
