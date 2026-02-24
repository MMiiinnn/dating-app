import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser, getAllUsers } from '../firebase/firestore';
import { useUser } from '../context/UserContext';

const GENDERS = ['male', 'female', 'other'];
const GENDER_EMOJI = { male: '👨', female: '👩', other: '🧑' };

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();
  const [existingUsers, setExistingUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'male',
    bio: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all existing profiles
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getAllUsers();
        setExistingUsers(users);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSelectUser = (user) => {
    localStorage.setItem('datingAppUid', user.uid);
    setCurrentUser(user);
    navigate('/discover');
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.age) {
      setError('Name, email, and age are required.');
      return;
    }
    const age = parseInt(form.age, 10);
    if (isNaN(age) || age < 18 || age > 100) {
      setError('Age must be between 18 and 100.');
      return;
    }

    setLoading(true);
    try {
      const uid = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const userData = {
        uid,
        name: form.name.trim(),
        age,
        gender: form.gender,
        bio: form.bio.trim(),
        email: form.email.trim().toLowerCase(),
      };

      await createUser(userData);
      localStorage.setItem('datingAppUid', uid);
      setCurrentUser(userData);
      navigate('/discover');
    } catch (err) {
      console.error(err);
      setError('Failed to create profile. Check your Firebase config and Firestore rules.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
            Breeze
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {showCreateForm
              ? 'Create your profile to start finding matches'
              : 'Select a profile or create a new one'}
          </p>
        </div>

        {/* Profile Selection */}
        {!showCreateForm && (
          <div className="bg-white rounded-3xl shadow-xl shadow-rose-100 p-6 sm:p-8 mb-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Select Existing Profile
            </h2>

            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
              </div>
            ) : existingUsers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">
                No profiles yet. Create the first one below!
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {existingUsers.map((user) => (
                  <button
                    key={user.uid}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-rose-200 hover:bg-rose-50 transition-all duration-200 text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-lg shrink-0">
                      {GENDER_EMOJI[user.gender?.toLowerCase()] || '🧑'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        {user.gender} · {user.age} yrs
                      </p>
                    </div>
                    <span className="text-xs text-gray-300 group-hover:text-rose-400 transition-colors">
                      Select →
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full py-3 rounded-xl border-2 border-dashed border-rose-200 text-rose-500 font-semibold text-sm hover:bg-rose-50 hover:border-rose-300 transition-all duration-200 active:scale-95"
              >
                + Create New Profile
              </button>
            </div>
          </div>
        )}

        {/* Create Profile */}
        {showCreateForm && (
          <div className="bg-white rounded-3xl shadow-xl shadow-rose-100 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all duration-200"
                  required
                />
              </div>

              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Age *
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="25"
                    min="18"
                    max="100"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent text-gray-800 bg-white transition-all duration-200"
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g} className="capitalize">
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  About You
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell potential matches a little about yourself..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent text-gray-800 placeholder-gray-400 resize-none transition-all duration-200"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-base shadow-md shadow-rose-200 hover:from-rose-600 hover:to-pink-600 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Profile...
                  </span>
                ) : (
                  'Create My Profile'
                )}
              </button>

              {existingUsers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Back to profile selection
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
