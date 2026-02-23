import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db } from './config';

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * @param {{ uid: string, name: string, age: number, gender: string, bio: string, email: string }} data
 */
export async function createUser(data) {
  try {
    await setDoc(doc(db, 'users', data.uid), {
      ...data,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('createUser error:', error);
    throw error;
  }
}

/**
 * @param {string} uid - The current user's UID
 * @returns {Promise<Array>}
 */
export async function getAllUsersExceptCurrent(uid) {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((user) => user.uid !== uid);
  } catch (error) {
    console.error('getAllUsersExceptCurrent error:', error);
    throw error;
  }
}

// === Likes ===

/**
 * @param {string} fromUid
 * @param {string} toUid
 * @returns {Promise<{ matched: boolean, matchId: string | null }>}
 */
export async function sendLike(fromUid, toUid) {
  try {
    const existingLike = await getLike(fromUid, toUid);
    if (existingLike) {
      return { matched: false, matchId: null };
    }

    await addDoc(collection(db, 'likes'), {
      fromUid,
      toUid,
      timestamp: serverTimestamp(),
    });

    const isMutual = await checkMutualLike(fromUid, toUid);
    if (isMutual) {
      const matchId = await createMatch(fromUid, toUid);
      return { matched: true, matchId };
    }

    return { matched: false, matchId: null };
  } catch (error) {
    console.error('sendLike error:', error);
    throw error;
  }
}

/**
 * @param {string} fromUid
 * @param {string} toUid
 * @returns {Promise<boolean>}
 */
async function getLike(fromUid, toUid) {
  const q = query(
    collection(db, 'likes'),
    where('fromUid', '==', fromUid),
    where('toUid', '==', toUid)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * @param {string} fromUid
 * @param {string} toUid
 * @returns {Promise<boolean>}
 */
export async function checkMutualLike(fromUid, toUid) {
  try {
    const q = query(
      collection(db, 'likes'),
      where('fromUid', '==', toUid),
      where('toUid', '==', fromUid)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('checkMutualLike error:', error);
    throw error;
  }
}

// === Matches ===

/**
 * @param {string} uid1
 * @param {string} uid2
 * @returns {Promise<string>} matchId
 */
export async function createMatch(uid1, uid2) {
  try {
    const existingMatch = await getExistingMatch(uid1, uid2);
    if (existingMatch) {
      return existingMatch.matchId;
    }

    const matchRef = await addDoc(collection(db, 'matches'), {
      userIds: [uid1, uid2],
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'matches', matchRef.id), { matchId: matchRef.id }, { merge: true });

    return matchRef.id;
  } catch (error) {
    console.error('createMatch error:', error);
    throw error;
  }
}

/**
 * @param {string} uid1
 * @param {string} uid2
 * @returns {Promise<object | null>}
 */
async function getExistingMatch(uid1, uid2) {
  const q1 = query(
    collection(db, 'matches'),
    where('userIds', 'array-contains', uid1)
  );
  const snapshot = await getDocs(q1);
  const match = snapshot.docs.find((d) => {
    const ids = d.data().userIds;
    return ids.includes(uid1) && ids.includes(uid2);
  });
  return match ? { matchId: match.id, ...match.data() } : null;
}

// === Availability ===

/**
 * @param {string} uid
 * @param {string} matchId
 * @param {Array<{ start: string, end: string }>} slots
 */
export async function saveAvailability(uid, matchId, slots) {
  try {
    const docId = `${uid}_${matchId}`;
    await setDoc(doc(db, 'availabilities', docId), {
      uid,
      matchId,
      slots,
    });
  } catch (error) {
    console.error('saveAvailability error:', error);
    throw error;
  }
}

// === Real-time Listeners ===

/**
 * @param {string} uid
 * @param {function} callback 
 * @returns {function} Unsubscribe function
 */
export function listenForMatches(uid, callback) {
  const q = query(
    collection(db, 'matches'),
    where('userIds', 'array-contains', uid)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const matches = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(matches);
  }, (error) => {
    console.error('listenForMatches error:', error);
  });

  return unsubscribe;
}

/**
 * @param {string} matchId
 * @param {function} callback 
 * @returns {function} Unsubscribe function
 */
export function listenForAvailability(matchId, callback) {
  const q = query(
    collection(db, 'availabilities'),
    where('matchId', '==', matchId)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const availabilities = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(availabilities);
  }, (error) => {
    console.error('listenForAvailability error:', error);
  });

  return unsubscribe;
}
