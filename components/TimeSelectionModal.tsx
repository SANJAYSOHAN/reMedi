import React, { useState, useEffect } from 'react';
import TimePicker from './TimePicker';

interface TimeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (time: string) => void;
  initialTime: string;
  title: string;
}

const TimeSelectionModal: React.FC<TimeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTime,
  title,
}) => {
  const [selectedTime, setSelectedTime] = useState(initialTime);

  useEffect(() => {
    setSelectedTime(initialTime);
  }, [initialTime]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(selectedTime);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs transform transition-all scale-100 opacity-100 animate-fade-in-up">
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
          <TimePicker value={selectedTime} onChange={setSelectedTime} />
        </div>
        <div className="bg-gray-50 px-6 py-4 grid grid-cols-2 gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeSelectionModal;
