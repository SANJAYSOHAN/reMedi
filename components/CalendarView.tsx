import React, { useState, useMemo } from 'react';
import type { Appointment } from '../types';
import { toYMDString } from '../utils/helpers';

interface CalendarViewProps {
  appointments: Appointment[];
  onDayClick: (day: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, onDayClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const daysInMonth = useMemo(() => {
    const days = [];
    // Days from previous month
    const startingDay = firstDayOfMonth.getDay(); // 0 is Sunday
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Days in current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    return days;
  }, [currentDate, firstDayOfMonth, lastDayOfMonth]);

  const appointmentDates = useMemo(() => {
    const dates = new Set<string>();
    appointments.forEach(appt => dates.add(appt.date));
    return dates;
  }, [appointments]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day: Date) => {
    const today = new Date();
    return day.getDate() === today.getDate() &&
           day.getMonth() === today.getMonth() &&
           day.getFullYear() === today.getFullYear();
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
        <h2 className="text-xl font-bold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map(day => (
          <div key={day} className="text-xs font-bold text-gray-500 uppercase">{day}</div>
        ))}
        {daysInMonth.map((day, index) => (
          <div key={index} className="py-1 flex justify-center items-center">
            {day && (
              <button
                onClick={() => onDayClick(day)}
                className={`w-10 h-10 rounded-full flex items-center justify-center relative transition-colors
                  ${isToday(day) ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-100'}
                `}
              >
                {day.getDate()}
                {appointmentDates.has(toYMDString(day)) && (
                  <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${isToday(day) ? 'bg-white' : 'bg-blue-500'}`}></span>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;