import { useEffect, useState } from 'react';
import { listenForMatches } from '../firebase/firestore';

/**
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

    return () => unsubscribe();
  }, [uid]);

  return { matches, loading };
}
