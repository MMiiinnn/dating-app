import { useEffect } from 'react';

/**
 * MatchNotification: a modal overlay that appears when a mutual match is detected.
 * Auto-dismisses after 5 seconds.
 */
export default function MatchNotification({ matchedUser, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!matchedUser) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hearts Rain */}
        <div className="text-6xl mb-4 animate-bounce-in">
          💘
        </div>

        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 mb-2">
          It's a Match!
        </h2>

        <p className="text-gray-500 text-sm mb-4">
          You and{' '}
          <span className="font-semibold text-gray-800">{matchedUser.name}</span>{' '}
          liked each other 🎉
        </p>

        <p className="text-xs text-gray-400 mb-6">
          Head to Matches to schedule your first date!
        </p>

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold hover:from-rose-600 hover:to-pink-600 transition-all duration-200 active:scale-95"
        >
          Awesome! 🎊
        </button>

        <p className="text-xs text-gray-300 mt-3">Auto-closes in 5 seconds</p>
      </div>
    </div>
  );
}
