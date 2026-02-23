import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { saveAvailability } from '../firebase/firestore';
import { useUser } from '../context/UserContext';
import { useAvailability } from '../hooks/useAvailability';
import TimeSlotPicker from '../components/TimeSlotPicker';
import Navbar from '../components/Navbar';
import { format } from 'date-fns';

export default function SchedulePage() {
  const { matchId } = useParams();
  const { currentUser } = useUser();
  const { myAvailability, partnerAvailability, commonSlot, loading } =
    useAvailability(matchId, currentUser?.uid);

  const [partner, setPartner] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Fetch partner info
  useEffect(() => {
    if (!matchId || !currentUser?.uid) return;

    const fetchPartner = async () => {
      try {
        const matchSnap = await getDoc(doc(db, 'matches', matchId));
        if (!matchSnap.exists()) return;
        const partnerUid = matchSnap.data().userIds.find((id) => id !== currentUser.uid);
        if (!partnerUid) return;
        const userSnap = await getDoc(doc(db, 'users', partnerUid));
        if (userSnap.exists()) setPartner({ uid: partnerUid, ...userSnap.data() });
      } catch (err) {
        console.error('Error fetching partner:', err);
      }
    };

    fetchPartner();
  }, [matchId, currentUser?.uid]);

  // Pre-populate slots
  useEffect(() => {
    if (myAvailability?.slots) {
      setSelectedSlots(myAvailability.slots);
      setSubmitted(true);
    }
  }, [myAvailability]);

  const handleSubmit = async () => {
    if (!selectedSlots.length) {
      setSaveError('Please select at least one time slot.');
      return;
    }
    setSaveError('');
    setSubmitting(true);
    try {
      await saveAvailability(currentUser.uid, matchId, selectedSlots);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setSaveError('Failed to save availability. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 pt-16 sm:pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6 sm:mb-8 animate-slide-up">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
              Schedule a Date
            </h1>
            {partner && (
              <p className="text-gray-500 mt-1 text-sm">
                Finding the perfect time with{' '}
                <span className="font-semibold text-rose-500">{partner.name}</span>
              </p>
            )}
          </div>

          {/* Common Slot Banner */}
          {commonSlot && (
            <div className="mb-6 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-emerald-100 animate-bounce-in">
              <div className="flex items-start sm:items-center gap-3">
                <span className="text-2xl sm:text-3xl shrink-0">✅</span>
                <div>
                  <p className="font-bold text-base sm:text-lg">Perfect Match Found!</p>
                  <p className="text-emerald-100 text-sm">
                    First available slot:
                  </p>
                  <p className="font-bold text-lg sm:text-xl mt-0.5">
                    {format(new Date(commonSlot.start), 'EEEE, MMMM d')} ·{' '}
                    {format(new Date(commonSlot.start), 'h:mm a')} –{' '}
                    {format(new Date(commonSlot.end), 'h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Cards Row */}
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className={`rounded-xl p-4 border ${myAvailability ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl text-green-500">{myAvailability ? '✅' : '⏳'}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-700">You</p>
                  <p className="text-xs text-gray-400">
                    {myAvailability
                      ? `${myAvailability.slots.length} slot${myAvailability.slots.length > 1 ? 's' : ''} submitted`
                      : 'Not submitted yet'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-4 border ${partnerAvailability ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl text-green-500">{partnerAvailability ? '✅' : '⏳'}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {partner?.name || 'Partner'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {partnerAvailability
                      ? `${partnerAvailability.slots.length} slot${partnerAvailability.slots.length > 1 ? 's' : ''} submitted`
                      : 'Waiting...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* No overlap message */}
          {myAvailability && partnerAvailability && !commonSlot && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-amber-700 font-medium">
                No overlapping slots found yet.
              </p>
              <p className="text-amber-500 text-sm mt-1">
                Try updating your availability with more time options.
              </p>
            </div>
          )}

          {/* Slot Picker */}
          <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                Your Availability
              </h2>
              {submitted && (
                <span className="text-xs bg-rose-100 text-rose-600 font-semibold px-3 py-1 rounded-full">
                  Submitted ✓
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <TimeSlotPicker onSlotsChange={setSelectedSlots} />

                {saveError && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                    {saveError}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedSlots.length}
                  className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-sm shadow-md shadow-rose-200 hover:from-rose-600 hover:to-pink-600 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : submitted ? (
                    'Update Availability'
                  ) : (
                    'Submit Availability'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
