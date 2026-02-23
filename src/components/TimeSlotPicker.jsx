import { useState } from 'react';
import { addDays, startOfDay, format, addHours, isBefore, isAfter } from 'date-fns';

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const WEEKS = 3;

/**
 * TimeSlotPicker: lets users select available 1-hour slots over the next 3 weeks.
 * Each selected slot becomes { start: ISOString, end: ISOString }.
 */
export default function TimeSlotPicker({ onSlotsChange }) {
  const [selectedSlots, setSelectedSlots] = useState([]);
  const today = startOfDay(new Date());
  const days = Array.from({ length: WEEKS * 7 }, (_, i) => addDays(today, i + 1));

  const toggleSlot = (day, hour) => {
    const start = addHours(startOfDay(day), hour).toISOString();
    const end = addHours(startOfDay(day), hour + 1).toISOString();

    setSelectedSlots((prev) => {
      const exists = prev.some((s) => s.start === start);
      const updated = exists
        ? prev.filter((s) => s.start !== start)
        : [...prev, { start, end }];

      onSlotsChange?.(updated);
      return updated;
    });
  };

  const isSelected = (day, hour) => {
    const start = addHours(startOfDay(day), hour).toISOString();
    return selectedSlots.some((s) => s.start === start);
  };

  // Group days by week
  const weeks = Array.from({ length: WEEKS }, (_, wi) =>
    days.slice(wi * 7, wi * 7 + 7)
  );

  return (
    <div className="space-y-6">
      {selectedSlots.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
          <p className="text-sm font-semibold text-rose-600 mb-2">
            ✅ {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedSlots
              .sort((a, b) => new Date(a.start) - new Date(b.start))
              .map((slot) => (
                <span
                  key={slot.start}
                  className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-lg font-medium"
                >
                  {format(new Date(slot.start), 'MMM d, h:mm a')}
                </span>
              ))}
          </div>
        </div>
      )}

      {weeks.map((weekDays, wi) => (
        <div key={wi}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Week {wi + 1}
          </h4>
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Day Headers */}
              <div className="flex gap-1 mb-1">
                <div className="w-16" />
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="w-20 text-center text-xs font-semibold text-gray-500"
                  >
                    <div>{format(day, 'EEE')}</div>
                    <div className="text-gray-400">{format(day, 'MMM d')}</div>
                  </div>
                ))}
              </div>

              {/* Hour Rows */}
              {HOURS.map((hour) => (
                <div key={hour} className="flex gap-1 mb-1 items-center">
                  <div className="w-16 text-xs text-gray-400 text-right pr-2 shrink-0">
                    {format(addHours(new Date().setHours(0, 0, 0, 0), hour), 'h a')}
                  </div>
                  {weekDays.map((day) => {
                    const selected = isSelected(day, hour);
                    return (
                      <button
                        key={`${day.toISOString()}-${hour}`}
                        onClick={() => toggleSlot(day, hour)}
                        className={`w-20 h-8 rounded-md text-xs font-medium transition-all duration-150 border ${
                          selected
                            ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-500'
                        }`}
                      >
                        {selected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
