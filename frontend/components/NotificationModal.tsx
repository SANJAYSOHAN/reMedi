
import React from 'react';
import type { NotificationPayload } from '../types';
import { PillIcon } from './icons/PillIcon';
import { ClockIcon } from './icons/ClockIcon';
import { formatTime12Hour } from '../utils/helpers';

interface NotificationModalProps {
  notification: NotificationPayload;
  onConfirm: () => void;
  onSnooze: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ notification, onConfirm, onSnooze }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all scale-100 opacity-100 animate-fade-in-up">
        <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-5">
                <PillIcon className="h-9 w-9 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Time for your medication!</h3>
            <p className="mt-2 text-gray-600">
                It's time to take <span className="font-bold">{notification.medication.name}</span> ({notification.medication.dosage}).
            </p>
            {notification.medication.instructions && (
                <p className="mt-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                    <strong>Instructions:</strong> {notification.medication.instructions}
                </p>
            )}
            <div className="mt-6 flex items-center justify-center text-gray-500">
                <ClockIcon className="w-5 h-5 mr-2" />
                <span className="font-medium">{notification.time} ({formatTime12Hour(notification.mealTime)})</span>
            </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 grid grid-cols-2 gap-3 rounded-b-2xl">
           <button 
              onClick={onSnooze}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
            >
              Snooze (15 min)
            </button>
            <button 
              onClick={onConfirm}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
            >
              I've Taken It
            </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
