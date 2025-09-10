
import React, { useState, useEffect, useRef } from 'react';

interface TimePickerProps {
  value: string; // "HH:MM" 24-hour format
  onChange: (newValue: string) => void;
}

const hours = Array.from({ length: 12 }, (_, i) => i + 1);
const minutes = Array.from({ length: 60 }, (_, i) => i);
const periods = ['AM', 'PM'];

const formatTwoDigits = (num: number) => num.toString().padStart(2, '0');

interface PickerColumnProps {
    values: (string | number)[];
    selectedValue: string | number;
    onSelect: (value: string | number) => void;
    label: string;
    className?: string;
}

const PickerColumn: React.FC<PickerColumnProps> = ({ values, selectedValue, onSelect, label, className }) => {
    const selectedItemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedItemRef.current) {
            selectedItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }, [selectedValue]);

    return (
      <div className={`flex flex-col items-center ${className}`}>
        {label && <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</span>}
        <div 
          className="h-40 w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar py-16"
          style={{ scrollbarWidth: 'none', ['msOverflowStyle' as any]: 'none' }}
        >
          {values.map((v) => (
            <div
              key={v}
              ref={v === selectedValue ? selectedItemRef : null}
              onClick={() => onSelect(v)}
              className={`flex items-center justify-center h-10 snap-center cursor-pointer text-2xl transition-all duration-200
                ${v === selectedValue ? 'font-bold text-gray-800 scale-110' : 'text-gray-300'}
              `}
            >
              {typeof v === 'number' ? formatTwoDigits(v) : v}
            </div>
          ))}
        </div>
      </div>
    );
};

// FIX: Refactored component to a standard function declaration to resolve return type error.
function TimePicker({ value, onChange }: TimePickerProps): JSX.Element {
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState('AM');

  useEffect(() => {
    const [h, m] = value.split(':').map(Number);
    let newPeriod = 'AM';
    let newHour = h;
    if (h >= 12) {
      newPeriod = 'PM';
      if (h > 12) {
        newHour = h - 12;
      }
    }
    if (h === 0) { // Midnight case
      newHour = 12;
    }
    setHour(newHour);
    setMinute(m);
    setPeriod(newPeriod);
  }, [value]);
  
  const handleTimeChange = (newHour: number, newMinute: number, newPeriod: string) => {
    let h24 = newHour;
    if (newPeriod === 'PM' && newHour < 12) {
      h24 += 12;
    }
    if (newPeriod === 'AM' && newHour === 12) { // Midnight case 12 AM is 00 hours
      h24 = 0;
    }

    onChange(`${formatTwoDigits(h24)}:${formatTwoDigits(newMinute)}`);
  };

  return (
    <div className="flex justify-center items-end space-x-1 p-2 bg-gray-100 rounded-lg">
      <PickerColumn
        label=""
        values={periods}
        selectedValue={period}
        onSelect={(p) => handleTimeChange(hour, minute, p as string)}
        className="w-16"
      />
      <PickerColumn
        label="H"
        values={hours}
        selectedValue={hour}
        onSelect={(h) => handleTimeChange(h as number, minute, period)}
        className="w-16"
      />
      <PickerColumn
        label="M"
        values={minutes}
        selectedValue={minute}
        onSelect={(m) => handleTimeChange(hour, m as number, period)}
        className="w-16"
      />
    </div>
  );
}

export default TimePicker;
