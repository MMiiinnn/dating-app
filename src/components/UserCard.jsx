import { useState } from 'react';
import { sendLike, cancelLike } from '../firebase/firestore';
import { useUser } from '../context/UserContext';

const GENDER_EMOJI = { male: '👨', female: '👩', other: '🧑' };

export default function UserCard({ user, onMatch, onLiked, onUnliked, alreadyLiked }) {
  const { currentUser } = useUser();
  const [liked, setLiked] = useState(alreadyLiked);
  const [liking, setLiking] = useState(false);
  const [unliking, setUnliking] = useState(false);

  const handleLike = async () => {
    if (liked || liking || !currentUser) return;
    setLiking(true);
    try {
      const result = await sendLike(currentUser.uid, user.uid);
      setLiked(true);
      onLiked?.(user.uid);
      if (result.matched) {
        onMatch?.(user, result.matchId);
      }
    } catch (err) {
      console.error('Like error:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleUnlike = async () => {
    if (!liked || unliking || !currentUser) return;
    setUnliking(true);
    try {
      await cancelLike(currentUser.uid, user.uid);
      setLiked(false);
      onUnliked?.(user.uid);
    } catch (err) {
      console.error('Unlike error:', err);
    } finally {
      setUnliking(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group animate-slide-up">
      {/* Card Header */}
      <div className="bg-gradient-to-br from-rose-400 to-rose-600 p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
          {GENDER_EMOJI[user.gender?.toLowerCase()] || '🧑'}
        </div>
        <div className="text-white">
          <h3 className="text-xl font-bold">{user.name}</h3>
          <p className="text-rose-100 text-sm capitalize">{user.gender} · {user.age} yrs</p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5">
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 min-h-[60px]">
          {user.bio || 'No bio provided.'}
        </p>
        <div className="mt-4">
          {liked ? (
            <button
              onClick={handleUnlike}
              disabled={unliking}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
                bg-rose-100 text-rose-400
                hover:bg-red-500 hover:text-white
                active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed group/btn"
            >
              {unliking ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                  Unliking...
                </span>
              ) : (
                <span>
                  <span className="group-hover/btn:hidden">❤️ Liked</span>
                  <span className="hidden group-hover/btn:inline">💔 Unlike</span>
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={handleLike}
              disabled={liking}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
                bg-gradient-to-r from-rose-500 to-rose-600 text-white
                hover:from-rose-600 hover:to-rose-700
                active:scale-95 shadow-sm hover:shadow-rose-200 hover:shadow-md
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {liking ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Liking...
                </span>
              ) : (
                '🤍 Like'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
