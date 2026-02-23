import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const NAV_LINKS = [
  { to: '/discover', label: 'Discover'},
  { to: '/matches', label: 'Matches'},
];

export default function Navbar() {
  const { currentUser } = useUser();
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-rose-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/discover" className="flex items-center gap-2 group">
          <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
            Dating App
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-200'
                    : 'text-gray-500 hover:bg-rose-50 hover:text-rose-500'
                }`}
              >
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Avatar */}
        {currentUser && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
              {currentUser.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {currentUser.name}
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}
