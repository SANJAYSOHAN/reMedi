// FIX: Import DailyAdherence from types.ts to resolve module export error.
import type { Medication, MedicationLog, MedicationTiming, Prescription, DailyAdherence } from '../types';
import { DosageUnit } from '../types';

export const getTimingLabel = (timing: MedicationTiming): string => {
    if (timing === 'bedtime') {
        return 'At Bedtime';
    }
    return timing.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export const getDosageUnitLabel = (unit: DosageUnit): string => {
    switch (unit) {
        case DosageUnit.TABLET: return 'Tablet(s)';
        case DosageUnit.ML: return 'ml';
        case DosageUnit.TABLE_SPOON: return 'Tbsp';
        case DosageUnit.TEA_SPOON: return 'Tsp';
        case DosageUnit.NIL: return '';
        default: return '';
    }
};

export const formatTime12Hour = (time: string): string => {
  if (!time) return '';
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; // Convert 0 to 12
  const minutePadded = minute < 10 ? `0${minute}` : minute;
  
  return `${hour12}:${minutePadded} ${ampm}`;
};


/**
 * Safely creates a Date object from a "YYYY-MM-DD" string.
 * This avoids timezone issues by interpreting the date as local midnight,
 * not UTC midnight.
 * @param dateStr The date string in "YYYY-MM-DD" format.
 * @returns A Date object.
 */
export const dateFromYMDString = (dateStr: string): Date => {
    if (!dateStr) return new Date(); // Fallback for safety
    const [year, month, day] = dateStr.split('-').map(Number);
    // JavaScript's Date month is 0-indexed.
    return new Date(year, month - 1, day);
};

/**
 * Safely converts a Date object to a "YYYY-MM-DD" string in the local timezone.
 * This avoids timezone issues that occur with `toISOString()`.
 * @param date The Date object.
 * @returns A date string in "YYYY-MM-DD" format.
 */
export const toYMDString = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() is zero-based
    const day = date.getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};


export const generateCalendarAdherence = (
  prescription: Prescription | null,
  logs: MedicationLog[],
  year: number,
  month: number // 0-indexed
): Map<string, DailyAdherence> => {
  const adherenceMap = new Map<string, DailyAdherence>();
  if (!prescription) return adherenceMap;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDateOfMonth = new Date(year, month, 1);
  const endDateOfMonth = new Date(year, month + 1, 0);

  for (let d = new Date(startDateOfMonth); d <= endDateOfMonth; d.setDate(d.getDate() + 1)) {
    const dateStr = toYMDString(d);
    const dayDate = dateFromYMDString(dateStr);

    const isFuture = dayDate > today;
    
    const dailyData: DailyAdherence = {
      date: new Date(d),
      taken: [],
      missed: [],
      scheduled: [],
      isFuture,
    };

    const logsForDay = logs.filter(log => log.date === dateStr && log.status === 'taken');

    for (const med of prescription.medications) {
      const medStartDate = dateFromYMDString(med.startDate);
      const medEndDate = new Date(medStartDate);
      medEndDate.setDate(medEndDate.getDate() + med.durationInDays - 1); // -1 because duration includes start day

      if (dayDate >= medStartDate && dayDate <= medEndDate) {
        // This medication is scheduled for this day.
        const wasTaken = logsForDay.some(log => log.medicationName === med.name && log.timing === med.timing);
        
        if (isFuture) {
          dailyData.scheduled.push(med);
        } else {
          if (wasTaken) {
            dailyData.taken.push(med);
          } else {
            dailyData.missed.push(med);
          }
        }
      }
    }
    
    if (dailyData.taken.length > 0 || dailyData.missed.length > 0 || dailyData.scheduled.length > 0) {
        adherenceMap.set(dateStr, dailyData);
    }
  }

  return adherenceMap;
};