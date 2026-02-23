import { useEffect, useState } from 'react';
import { listenForAvailability } from '../firebase/firestore';
import { findFirstCommonSlot } from '../utils/scheduler';

/**
 * Real-time availability hook.
 * Subscribes to Firestore /availabilities where matchId == matchId.
 * When both users have submitted, computes the first common slot.
 *
 * The findFirstCommonSlot call lives inside the snapshot callback,
 * NOT during render — this prevents infinite re-renders.
 *
 * @param {string | null} matchId
 * @param {string | null} currentUid
 * @returns {{ myAvailability: object | null, partnerAvailability: object | null, commonSlot: object | null, loading: boolean }}
 */
export function useAvailability(matchId, currentUid) {
  const [myAvailability, setMyAvailability] = useState(null);
  const [partnerAvailability, setPartnerAvailability] = useState(null);
  const [commonSlot, setCommonSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId || !currentUid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = listenForAvailability(matchId, (availabilities) => {
      const mine = availabilities.find((a) => a.uid === currentUid) || null;
      const partner = availabilities.find((a) => a.uid !== currentUid) || null;

      setMyAvailability(mine);
      setPartnerAvailability(partner);

      // Compute overlap inside callback — NOT during render
      if (mine && partner) {
        const slot = findFirstCommonSlot(mine.slots, partner.slots);
        setCommonSlot(slot);
      } else {
        setCommonSlot(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [matchId, currentUid]);

  return { myAvailability, partnerAvailability, commonSlot, loading };
}
