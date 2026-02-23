import { useState, useEffect, useCallback } from 'react';
import { getAllUsersExceptCurrent } from '../firebase/firestore';
import { useUser } from '../context/UserContext';
import UserCard from '../components/UserCard';
import MatchNotification from '../components/MatchNotification';
import Navbar from '../components/Navbar';

export default function DiscoverPage() {
  const { currentUser } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchEvent, setMatchEvent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const allUsers = await getAllUsersExceptCurrent(currentUser.uid);
        setUsers(allUsers);
      } catch (err) {
        console.error(err);
        setError('Failed to load users. Check your Firestore rules.');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [currentUser?.uid]);

  // Avoid re-rendering by using useCallback
  const handleMatch = useCallback((matchedUser, matchId) => {
    setMatchEvent({ user: matchedUser, matchId });
  }, []);

  const handleCloseNotification = useCallback(() => {
    setMatchEvent(null);
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <h1 className="text-3xl font-extrabold text-gray-800">
              Discover People
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Like someone to see if it's mutual!
            </p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading profiles...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-xl font-semibold text-gray-600">No other profiles yet</h3>
              <p className="text-gray-400 text-sm mt-2">
                Open this app in another browser tab and create a second user!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {users.map((user) => (
                <UserCard
                  key={user.uid}
                  user={user}
                  onMatch={handleMatch}
                  alreadyLiked={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Match notification modal */}
      {matchEvent && (
        <MatchNotification
          matchedUser={matchEvent.user}
          onClose={handleCloseNotification}
        />
      )}
    </>
  );
}
