import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useUser } from '../context/UserContext';
import { useMatches } from '../hooks/useMatches';
import Navbar from '../components/Navbar';
import { format } from 'date-fns';

export default function MatchesPage() {
  const { currentUser } = useUser();
  const { matches, loading } = useMatches(currentUser?.uid);
  const [matchDetails, setMatchDetails] = useState({}); 

  // Fetch partner profile 
  useEffect(() => {
    if (!matches.length || !currentUser) return;

    const fetchPartners = async () => {
      const details = {};
      await Promise.all(
        matches.map(async (match) => {
          const partnerUid = match.userIds.find((id) => id !== currentUser.uid);
          if (!partnerUid || details[match.id]) return;
          try {
            const userSnap = await getDoc(doc(db, 'users', partnerUid));
            if (userSnap.exists()) {
              details[match.id] = { uid: partnerUid, ...userSnap.data() };
            }
          } catch (err) {
            console.error('Error fetching partner:', err);
          }
        })
      );
      setMatchDetails((prev) => ({ ...prev, ...details }));
    };

    fetchPartners();
  }, [matches, currentUser]);

  const GENDER_EMOJI = { male: '👨', female: '👩', other: '🧑' };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 pt-16 sm:pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6 sm:mb-8 animate-slide-up">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Your Matches</h1>
            <p className="text-gray-500 mt-1 text-sm">
              You both liked each other — now schedule a date!
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading matches...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-xl font-semibold text-gray-600">No matches yet</h3>
              <p className="text-gray-400 text-sm mt-2">
                Head to Discover and start liking people!
              </p>
              <Link
                to="/discover"
                className="inline-block mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-sm hover:from-rose-600 hover:to-pink-600 transition-all duration-200 active:scale-95"
              >
                Go Discover →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => {
                const partner = matchDetails[match.id];
                return (
                  <div
                    key={match.id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-4 sm:p-5 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 animate-slide-up"
                  >
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-2xl shrink-0">
                      {GENDER_EMOJI[partner?.gender?.toLowerCase()] || '💞'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 text-base sm:text-lg truncate">
                        {partner?.name || 'Loading...'}
                      </h3>
                      {partner && (
                        <p className="text-gray-400 text-sm capitalize">
                          {partner.gender} · {partner.age} yrs
                        </p>
                      )}
                      {match.createdAt?.toDate && (
                        <p className="text-xs text-gray-300 mt-0.5">
                          Matched {format(match.createdAt.toDate(), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    <Link
                      to={`/schedule/${match.id}`}
                      className="w-full sm:w-auto text-center shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-sm hover:from-rose-600 hover:to-pink-600 transition-all duration-200 active:scale-95 shadow-sm"
                    >
                      Schedule
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
