
import { useEffect, useCallback, useRef } from 'react';
import type { User, Prescription, Medication } from '../types';
import { apiService } from '../services/api';
import { MedicationTiming } from '../types';
import { toYMDString, dateFromYMDString } from '../utils/helpers';
import { LocalNotifications, Channel } from '@capacitor/local-notifications';


const NOTIFICATION_OFFSET_MINUTES = 15; // e.g., 'before meal' means 15 mins before
const SNOOZE_DURATION_MINUTES = 10;
const ACTION_TYPE_ID = 'MEDICATION_ACTIONS';
const CHANNEL_ID = 'medication_alarms';

export const useNotifications = (user: User | null, prescription: Prescription | null) => {
  const checkedTimings = useRef<Set<string>>(new Set());
  const isSetupDone = useRef<boolean>(false);

  // One-time setup for notification permissions, channels, and actions
  useEffect(() => {
    const setup = async () => {
      if (isSetupDone.current) return;
      isSetupDone.current = true;

      try {
        await LocalNotifications.requestPermissions();
        
        const channel: Channel = {
          id: CHANNEL_ID,
          name: 'Medication Alarms',
          description: 'Reminders to take medication',
          importance: 5, // Max importance for alarm-like behavior
          sound: 'alarm.wav', // NOTE: You must add 'alarm.wav' to the native Android/iOS project resources
          visibility: 1,
          vibration: true,
        };
        await LocalNotifications.createChannel(channel);

        await LocalNotifications.registerActionTypes({
          types: [{
            id: ACTION_TYPE_ID,
            actions: [
              { id: 'confirm', title: "I've Taken It" },
              { id: 'snooze', title: `Snooze for ${SNOOZE_DURATION_MINUTES} mins` },
            ],
          }],
        });
      } catch (e) {
        console.error('Error setting up local notifications', e);
      }
    };
    setup();
  }, []);

  // Listener for user interactions with the notification
  useEffect(() => {
    const addListener = async () => {
        await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          async (action) => {
            const { actionId, notification } = action;
            const medication = notification.extra?.medication as Medication | undefined;
            const userId = notification.extra?.userId as string | undefined;

            if (!medication || !userId) return;

            if (actionId === 'confirm') {
              await apiService.logMedication(userId, {
                date: toYMDString(new Date()),
                medicationName: medication.name,
                timing: medication.timing,
                status: 'taken',
              });
            } else if (actionId === 'snooze') {
              const snoozeTime = new Date(Date.now() + SNOOZE_DURATION_MINUTES * 60 * 1000);
              await LocalNotifications.schedule({
                notifications: [{
                  title: "Reminder: Time for your medication!",
                  body: `It's time to take ${medication.name} (${medication.dosage}).`,
                  id: notification.id + Math.floor(Math.random() * 1000), // Ensure new ID
                  schedule: { at: snoozeTime },
                  sound: 'alarm.wav',
                  channelId: CHANNEL_ID,
                  actionTypeId: ACTION_TYPE_ID,
                  extra: { medication, userId },
                }],
              });
            }
          }
        );
    }
    addListener();
    // It's recommended to have a cleanup function for the listener,
    // though the provided Capacitor type definition doesn't show one directly.
    // This would typically look like:
    // return () => { listener.remove(); }
  }, []);

  const checkNotifications = useCallback(async () => {
    if (!user || !prescription || !prescription.medications) return;

    const medicationsToCheck = prescription.medications;
    const now = new Date();
    const todayStr = toYMDString(now);
    const logs = await apiService.getMedicationLogs(user.id);

    for (const med of medicationsToCheck) {
      const startDate = dateFromYMDString(med.startDate);
      const endDate = new Date(startDate.getTime());
      endDate.setDate(startDate.getDate() + med.durationInDays - 1);

      if (now < startDate || now > endDate) continue;

      const timingKey = `${todayStr}-${med.timing}`;
      const alreadyTaken = logs.some(log => log.date === todayStr && log.timing === med.timing && log.status === 'taken');
      
      if (checkedTimings.current.has(timingKey) || alreadyTaken) continue;

      let mealTimeStr: string | undefined;
      let isBefore: boolean = false;

      switch (med.timing) {
          case MedicationTiming.BeforeBreakfast: mealTimeStr = user.mealTimings.breakfast; isBefore = true; break;
          case MedicationTiming.AfterBreakfast: mealTimeStr = user.mealTimings.breakfast; break;
          case MedicationTiming.BeforeLunch: mealTimeStr = user.mealTimings.lunch; isBefore = true; break;
          case MedicationTiming.AfterLunch: mealTimeStr = user.mealTimings.lunch; break;
          case MedicationTiming.BeforeDinner: mealTimeStr = user.mealTimings.dinner; isBefore = true; break;
          case MedicationTiming.AfterDinner: mealTimeStr = user.mealTimings.dinner; break;
          case MedicationTiming.EmptyStomachBreakfast: mealTimeStr = user.mealTimings.breakfast; isBefore = true; break;
          case MedicationTiming.EmptyStomachLunch: mealTimeStr = user.mealTimings.lunch; isBefore = true; break;
          case MedicationTiming.EmptyStomachDinner: mealTimeStr = user.mealTimings.dinner; isBefore = true; break;
      }
      
      if(mealTimeStr) {
        const [hours, minutes] = mealTimeStr.split(':').map(Number);
        const mealTime = new Date();
        mealTime.setHours(hours, minutes, 0, 0);

        let notificationTime = new Date(mealTime);
        if (isBefore) {
          notificationTime.setMinutes(mealTime.getMinutes() - NOTIFICATION_OFFSET_MINUTES);
        } else {
          notificationTime.setMinutes(mealTime.getMinutes() + NOTIFICATION_OFFSET_MINUTES);
        }

        // Trigger notification only at the exact minute to avoid re-triggering
        if (now.getHours() === notificationTime.getHours() && now.getMinutes() === notificationTime.getMinutes()) {
          const notificationId = parseInt(`${now.getFullYear()}${String(now.getMonth()).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(hours).padStart(2,'0')}${String(minutes).padStart(2,'0')}`);
          
          await LocalNotifications.schedule({
            notifications: [{
              title: "Time for your medication!",
              body: `It's time to take ${med.name} (${med.dosage}). ${med.instructions ? 'Instructions: ' + med.instructions : ''}`,
              id: notificationId,
              schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
              sound: 'alarm.wav',
              channelId: CHANNEL_ID,
              actionTypeId: ACTION_TYPE_ID,
              extra: { medication: med, userId: user.id }
            }]
          });
          
          checkedTimings.current.add(timingKey);
          return; // Show one notification at a time
        }
      }
    }
  }, [user, prescription]);

  // Effect to run the check periodically
  useEffect(() => {
    const interval = setInterval(checkNotifications, 60 * 1000); // Check every minute

    // Reset checked timings at midnight to allow notifications for the next day
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime() - now.getTime();
    const midnightTimer = setTimeout(() => {
      checkedTimings.current.clear();
    }, msUntilMidnight);

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimer);
    };
  }, [checkNotifications]);

  // This hook now only contains background logic and does not return anything to render.
};
