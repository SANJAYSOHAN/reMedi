import React, { useState, useEffect, useMemo } from 'react';
import type { User, Prescription, MedicationLog, Medication, DailyAdherence } from '../types';
import { apiService } from '../services/api';
import { generateCalendarAdherence, getDosageUnitLabel, getTimingLabel, toYMDString } from '../utils/helpers';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CloseIcon } from './icons/CloseIcon';


const AdherenceDayDetailModal: React.FC<{ dayData: DailyAdherence, onClose: () => void }> = ({ dayData, onClose }) => {
    
    const MedicationRow: React.FC<{med: Medication, icon: React.ReactNode}> = ({med, icon}) => (
        <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 pt-0.5">{icon}</div>
            <div>
                <p className="font-semibold text-gray-800">{med.name} <span className="text-sm font-normal text-gray-600">({med.dosage} {getDosageUnitLabel(med.dosageUnit)})</span></p>
                <p className="text-xs text-gray-500">{getTimingLabel(med.timing)}</p>
                 {med.instructions && <p className="text-xs text-blue-600 bg-blue-50 p-1.5 rounded-md mt-1"><strong>Note:</strong> {med.instructions}</p>}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-fade-in-up">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-xl font-bold text-gray-900">
                            Adherence for {dayData.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h3>
                        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500" aria-label="Close modal">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        {dayData.isFuture && dayData.scheduled.length > 0 && (
                            <section>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-2">Scheduled</h4>
                                <div className="space-y-3">
                                    {dayData.scheduled.map((med, i) => <MedicationRow key={`sch-${i}`} med={med} icon={<ClockIcon className="w-5 h-5 text-blue-500" />} />)}
                                </div>
                            </section>
                        )}
                        {!dayData.isFuture && dayData.taken.length > 0 && (
                            <section>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-green-600 mb-2">Taken</h4>
                                 <div className="space-y-3">
                                    {dayData.taken.map((med, i) => <MedicationRow key={`tak-${i}`} med={med} icon={<CheckCircleIcon className="w-5 h-5 text-green-500" />} />)}
                                </div>
                            </section>
                        )}
                         {!dayData.isFuture && dayData.missed.length > 0 && (
                            <section>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-red-600 mb-2">Missed</h4>
                                 <div className="space-y-3">
                                    {dayData.missed.map((med, i) => <MedicationRow key={`mis-${i}`} med={med} icon={<XCircleIcon className="w-5 h-5 text-red-500" />} />)}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 text-right rounded-b-2xl">
                    <button onClick={onClose} type="button" className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700">Close</button>
                </div>
            </div>
        </div>
    )
}

const PatientAdherenceCalendarPage: React.FC<{ patient: User, onBack: () => void }> = ({ patient, onBack }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [adherenceData, setAdherenceData] = useState<Map<string, DailyAdherence>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DailyAdherence | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prescription, logs] = await Promise.all([
          apiService.getPrescription(patient.id),
          apiService.getMedicationLogs(patient.id),
        ]);
        const data = generateCalendarAdherence(prescription, logs, currentDate.getFullYear(), currentDate.getMonth());
        setAdherenceData(data);
      } catch (error) {
        console.error("Failed to fetch adherence data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [patient.id, currentDate]);
  
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const daysInMonth = useMemo(() => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) { days.push(null); }
    for (let i = 1; i <= lastDate; i++) { days.push(new Date(year, month, i)); }
    return days;
  }, [currentDate]);

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                 <h2 className="text-2xl font-bold text-gray-800">
                    Adherence for: <span className="text-blue-600">{patient.firstName} {patient.lastName}</span>
                 </h2>
                 <p className="text-gray-500">Click on a day to see detailed adherence information.</p>
            </div>
            <button onClick={onBack} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Dashboard
            </button>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
             <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                <h3 className="text-xl font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="text-xs font-bold text-gray-500 uppercase">{day}</div>)}
                {daysInMonth.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`}></div>;
                    
                    const dateStr = toYMDString(day);
                    const data = adherenceData.get(dateStr);
                    const isToday = new Date().toDateString() === day.toDateString();

                    let statusDot = null;
                    if (data) {
                        if (data.isFuture) {
                           statusDot = <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-blue-500"></span>;
                        } else if (data.missed.length > 0 && data.taken.length === 0) { // All missed
                           statusDot = <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-red-500"></span>;
                        } else if (data.missed.length > 0 && data.taken.length > 0) { // Partial
                           statusDot = <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500"></span>;
                        } else if (data.taken.length > 0) { // All taken
                           statusDot = <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-green-500"></span>;
                        }
                    }

                    return (
                         <div key={dateStr} className="py-1 flex justify-center items-center">
                            <button
                                onClick={() => data && setSelectedDay(data)}
                                disabled={!data}
                                className={`w-10 h-10 rounded-full flex items-center justify-center relative transition-colors
                                  ${isToday ? 'bg-blue-600 text-white font-bold' : data ? 'hover:bg-blue-100' : 'text-gray-400'}
                                  ${!data && 'cursor-not-allowed'}
                                `}
                            >
                                {day.getDate()}
                                {isToday && statusDot ? <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-white"></span> : statusDot}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
        
        {selectedDay && <AdherenceDayDetailModal dayData={selectedDay} onClose={() => setSelectedDay(null)} />}
    </div>
  );
};

export default PatientAdherenceCalendarPage;