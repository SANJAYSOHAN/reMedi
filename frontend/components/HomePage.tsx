
import React, { useState, useEffect, useMemo } from 'react';
import type { User, Prescription, Medication, MedicationLog } from '../types';
import { apiService } from '../services/api';
import { PillIcon } from './icons/PillIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { SunIcon, MoonIcon, SunsetIcon } from './icons/TimeIcons';
import { CheckIcon } from './icons/CheckIcon';
import { getDosageUnitLabel, toYMDString, dateFromYMDString } from '../utils/helpers';

interface HomePageProps {
  user: User;
  prescription: Prescription | null;
}

const formatTime12Hour = (time: string): string => {
  if (!time) return '';
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; // Convert 0 to 12
  const minutePadded = minute < 10 ? `0${minute}` : minute;
  
  return `${hour12}:${minutePadded} ${ampm}`;
};

const MedicationItem: React.FC<{ med: Medication, isTaken: boolean }> = ({ med, isTaken }) => {
    const timingLabel = med.timing.includes('before') ? 'Before food' : 'After food';
    const dosageUnitLabel = getDosageUnitLabel(med.dosageUnit);
    
    return (
        <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${isTaken ? 'bg-green-50/70 border-green-200' : 'bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300'}`}>
            <div className="flex items-center">
                 <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 ${isTaken ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {isTaken ? <CheckIcon className="w-6 h-6 text-green-600" /> : <PillIcon className="w-6 h-6 text-blue-600" />}
                </div>
                <div>
                    <p className={`font-semibold ${isTaken ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{med.name}</p>
                    <p className={`text-sm ${isTaken ? 'text-gray-400' : 'text-gray-600'}`}>
                        {med.dosage} {dosageUnitLabel}
                        <span className="text-gray-400 font-normal ml-2">({timingLabel})</span>
                    </p>
                </div>
            </div>
            {isTaken && (
                <div className="text-green-600">
                    <span className="font-bold text-sm">Taken</span>
                </div>
            )}
        </div>
    );
};


const HomePage: React.FC<HomePageProps> = ({ user, prescription }) => {
    const [logs, setLogs] = useState<MedicationLog[]>([]);
    const [adminInfo, setAdminInfo] = useState<{ hospitalName: string; adminName: string } | null>(null);
    const today = toYMDString(new Date());
    
    useEffect(() => {
        const fetchData = async () => {
            const userLogs = await apiService.getMedicationLogs(user.id);
            setLogs(userLogs);
            if (user.hospitalCode) {
                const info = await apiService.getAdminByHospitalCode(user.hospitalCode);
                setAdminInfo(info);
            }
        };
        fetchData();
    }, [user.id, user.hospitalCode]);
    
    const todaySchedule = useMemo(() => {
        if (!prescription) return [];
        
        const todayMeds = prescription.medications.filter(med => {
            const startDate = dateFromYMDString(med.startDate);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + med.durationInDays - 1);
            const todayDate = new Date();
            todayDate.setHours(0,0,0,0);
            return todayDate >= startDate && todayDate <= endDate;
        });

        const schedule = [
            { title: "Morning", time: user.mealTimings.breakfast, icon: <SunIcon className="w-8 h-8 text-yellow-500"/>, meal: 'breakfast' },
            { title: "Afternoon", time: user.mealTimings.lunch, icon: <SunsetIcon className="w-8 h-8 text-orange-500"/>, meal: 'lunch' },
            { title: "Dinner", time: user.mealTimings.dinner, icon: <MoonIcon className="w-8 h-8 text-indigo-500"/>, meal: 'dinner' },
        ];
        
        return schedule
            .map(item => ({
                ...item,
                medications: todayMeds.filter(m => m.timing.includes(item.meal))
            }))
            .filter(item => item.medications.length > 0)
            .sort((a, b) => a.time.localeCompare(b.time));

    }, [prescription, user.mealTimings]);

  if (!prescription) {
    return (
      <div className="text-center p-10 bg-white rounded-xl shadow-lg border border-gray-100">
        <PillIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700">No Prescription Found</h2>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">Your doctor has not uploaded a prescription for you yet. Please check back later or contact your provider.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        {adminInfo ? (
            <p className="text-lg text-gray-600">
                Your care is managed by <span className="font-semibold text-blue-600">Dr. {adminInfo.adminName}</span> from <span className="font-semibold text-gray-800">{adminInfo.hospitalName}</span>.
            </p>
        ) : (
            <p className="text-lg text-gray-600">Your medication schedule for today.</p>
        )}
      </div>
      
      <div className="space-y-6">
        {todaySchedule.length > 0 ? todaySchedule.map((scheduleItem, idx) => (
          <div key={scheduleItem.title} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                    {scheduleItem.icon}
                </div>
                <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-800">{scheduleItem.title}</h3>
                    <p className="text-md font-medium text-gray-500">{formatTime12Hour(scheduleItem.time)}</p>
                </div>
            </div>
            <div className="space-y-3">
                {scheduleItem.medications.map((med, index) => {
                    const isTaken = logs.some(log => log.date === today && log.timing === med.timing && log.status === 'taken');
                    return <MedicationItem key={`${med.name}-${index}`} med={med} isTaken={isTaken} />;
                })}
            </div>
          </div>
        )) : (
            <div className="text-center py-10 bg-white rounded-2xl shadow-lg border border-gray-100">
                <PillIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-bold text-gray-700 text-lg">All Clear!</h3>
                <p className="text-sm text-gray-500">You have no medications scheduled for today.</p>
            </div>
        )}
      </div>

      {prescription.dietPlan && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 animate-fade-in-up" style={{ animationDelay: `${todaySchedule.length * 100}ms` }}>
          <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
            <CalendarIcon className="w-6 h-6 mr-3 text-blue-500" />
            Your Diet Plan
          </h3>
          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{prescription.dietPlan}</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
