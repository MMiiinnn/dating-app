import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../firebase/firestore';
import { useUser } from '../context/UserContext';

const GENDERS = ['male', 'female', 'other'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'male',
    bio: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
            Breeze
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Create your profile to start finding matches
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-rose-100 p-8">
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

            <div className="grid grid-cols-2 gap-4">
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
          </form>
        </div>
      </div>
    </div>
  );
}
