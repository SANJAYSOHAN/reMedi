






import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { User, Prescription, Medication } from '../types';
import { apiService } from '../services/api';
import { MedicationTiming, DosageUnit } from '../types';
import { ayurvedicMedicines } from '../services/ayurvedicMedicines';
import { getTimingLabel, getDosageUnitLabel } from '../utils/helpers';
import { TrashIcon } from './icons/TrashIcon';
import { SearchIcon } from './icons/SearchIcon';
import { useAuth } from '../hooks/useAuth';

const instructionSuggestions = [
    "Water", "Warm Water", "Hot Water", "Milk", "Butter Milk", "Ghee", "Butter", "Honey", "Pomegranate Juice"
];

const ManagePrescriptionsPage: React.FC = () => {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const patientSearchRef = useRef<HTMLDivElement>(null);
  
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '1',
    dosageUnit: DosageUnit.TABLET,
    durationInDays: 30,
    startDate: new Date().toISOString().split('T')[0]
  });
  
  const [timingRelation, setTimingRelation] = useState<'before' | 'after' | 'empty-stomach'>('before');
  const [selectedMeals, setSelectedMeals] = useState<Record<string, boolean>>({
    breakfast: true,
    lunch: false,
    dinner: false,
  });
  const [isBedtime, setIsBedtime] = useState<boolean>(false);

  const [addInstructions, setAddInstructions] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [instructionSuggestion, setInstructionSuggestion] = useState('');

  const [addMedMessage, setAddMedMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [savePrescriptionMessage, setSavePrescriptionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  
  const inputBaseClasses = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

  const fetchData = useCallback(async () => {
    if (!adminUser || !adminUser.hospitalCode) return;
    const patientUsers = await apiService.getPatientsByHospitalCode(adminUser.hospitalCode);
    setUsers(patientUsers);
    
    if (patientUsers.length > 0) {
      // If no user is selected, or the selected user is not in the list, select the first one
      if (!selectedUserId || !patientUsers.find(u => u.id === selectedUserId)) {
        const firstUser = patientUsers[0];
        setSelectedUserId(firstUser.id);
        setPatientSearchQuery(`${firstUser.firstName} ${firstUser.lastName}`);
      }
    } else {
        // No patients for this admin, reset selection
        setSelectedUserId('');
        setCurrentPrescription(null);
        setPatientSearchQuery('');
    }
  }, [adminUser, selectedUserId]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUser]);
  
  useEffect(() => {
      const fetchPrescription = async () => {
          if(selectedUserId) {
              setIsLoading(true);
              const p = await apiService.getPrescription(selectedUserId);
              if(p) {
                  setCurrentPrescription(p);
              } else {
                  setCurrentPrescription({ userId: selectedUserId, medications: [], dietPlan: '' });
              }
              setIsLoading(false);
          } else {
            setCurrentPrescription(null);
            setIsLoading(false);
          }
      };
      fetchPrescription();
  }, [selectedUserId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientSearchRef.current && !patientSearchRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleAddMedication = () => {
    if (!newMed.name || !newMed.dosage) {
        setAddMedMessage({ type: 'error', text: 'Medication name and dosage are required.' });
        return;
    }
    
    const meals = Object.entries(selectedMeals).filter(([, isSelected]) => isSelected).map(([meal]) => meal);
    if (meals.length === 0 && !isBedtime) {
        setAddMedMessage({ type: 'error', text: 'Please select at least one timing (meal or bedtime).' });
        return;
    }

    if (currentPrescription) {
        let newMedications: Medication[] = [];

        if (meals.length > 0) {
            const mealMeds = meals.map(meal => {
                const timingStr = `${timingRelation}-${meal}`;
                const newMedication: Medication = {
                    ...newMed,
                    durationInDays: Number(newMed.durationInDays),
                    timing: timingStr as MedicationTiming,
                };
                if (addInstructions && instructions.trim()) {
                    newMedication.instructions = instructions.trim();
                }
                return newMedication;
            });
            newMedications.push(...mealMeds);
        }

        if (isBedtime) {
            const bedtimeMed: Medication = {
                ...newMed,
                durationInDays: Number(newMed.durationInDays),
                timing: MedicationTiming.Bedtime,
            };
            if (addInstructions && instructions.trim()) {
                bedtimeMed.instructions = instructions.trim();
            }
            newMedications.push(bedtimeMed);
        }

        const isDuplicate = newMedications.some(newMedToAdd => 
            currentPrescription.medications.some(existingMed =>
                existingMed.name.trim().toLowerCase() === newMedToAdd.name.trim().toLowerCase() &&
                existingMed.dosage.trim().toLowerCase() === newMedToAdd.dosage.trim().toLowerCase() &&
                existingMed.dosageUnit === newMedToAdd.dosageUnit &&
                existingMed.timing === newMedToAdd.timing
            )
        );

        if (isDuplicate) {
            setAddMedMessage({ type: 'error', text: 'You have already added these medication details. Please check the current list.' });
            return;
        }

        const updatedMeds = [...currentPrescription.medications, ...newMedications];
        setCurrentPrescription({ ...currentPrescription, medications: updatedMeds });
        
        // Reset form
        setNewMed({
            name: '',
            dosage: '1',
            dosageUnit: DosageUnit.TABLET,
            durationInDays: 30,
            startDate: new Date().toISOString().split('T')[0]
        });
        setSelectedMeals({ breakfast: true, lunch: false, dinner: false });
        setTimingRelation('before');
        setAddInstructions(false);
        setInstructions('');
        setInstructionSuggestion('');
        setAddMedMessage(null);
        setIsBedtime(false);
    }
  };

  const handleRemoveMedication = (indexToRemove: number) => {
      if (currentPrescription) {
          const updatedMeds = currentPrescription.medications.filter((_, index) => index !== indexToRemove);
          setCurrentPrescription({ ...currentPrescription, medications: updatedMeds });
      }
  };
  
  const handleMealChange = (meal: string, isChecked: boolean) => {
    setSelectedMeals(prev => ({...prev, [meal]: isChecked}));
  };
  
  const handleSelectAllMeals = (isChecked: boolean) => {
    setSelectedMeals({
      breakfast: isChecked,
      lunch: isChecked,
      dinner: isChecked,
    });
  };

  const areAllMealsSelected = selectedMeals.breakfast && selectedMeals.lunch && selectedMeals.dinner;

  const handleSavePrescription = async () => {
    if (currentPrescription) {
        setSavePrescriptionMessage({type: 'success', text: `Prescription for ${selectedUserId} saved successfully!`});
        setTimeout(() => setSavePrescriptionMessage(null), 3000);

        try {
            await apiService.savePrescription(currentPrescription);
        } catch (error) {
            setSavePrescriptionMessage({type: 'error', text: 'Failed to save prescription. Please try again.'});
        }
    }
  };
  
  const filteredUsers = users.filter(user => {
    const query = patientSearchQuery.toLowerCase();
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    return (
        user.id.toLowerCase().includes(query) ||
        (user.phone && user.phone.includes(query)) ||
        fullName.includes(query)
    );
  });
  
  const morningMeds = currentPrescription?.medications
    .map((med, index) => ({ med, originalIndex: index }))
    .filter(({ med }) => med.timing.includes('breakfast')) || [];

  const afternoonMeds = currentPrescription?.medications
    .map((med, index) => ({ med, originalIndex: index }))
    .filter(({ med }) => med.timing.includes('lunch')) || [];

  const nightMeds = currentPrescription?.medications
    .map((med, index) => ({ med, originalIndex: index }))
    .filter(({ med }) => med.timing.includes('dinner') || med.timing.includes('bedtime')) || [];

  const selectedUser = users.find(user => user.id === selectedUserId);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div ref={patientSearchRef} className="relative max-w-md">
            <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    id="user-select"
                    type="text"
                    value={patientSearchQuery}
                    onChange={e => {
                      setPatientSearchQuery(e.target.value);
                      if (!isPatientDropdownOpen) setIsPatientDropdownOpen(true);
                    }}
                    onFocus={() => setIsPatientDropdownOpen(true)}
                    placeholder={users.length > 0 ? "Search by name, ID, or phone..." : "No patients found"}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    autoComplete="off"
                    disabled={users.length === 0}
                  />
            </div>
              {isPatientDropdownOpen && users.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {filteredUsers.length > 0 ? filteredUsers.map(user => (
                    <div
                      key={user.id}
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setPatientSearchQuery(`${user.firstName} ${user.lastName}`);
                        setIsPatientDropdownOpen(false);
                      }}
                      className="text-gray-900 cursor-pointer select-none relative p-3 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center">
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span className="font-bold text-blue-600">{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</span>
                            )}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName} {user.age ? `(${user.age})` : ''}</p>
                            <p className="text-sm text-gray-500">{user.id}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                     <div className="px-4 py-2 text-sm text-gray-500">No patients found.</div>
                  )}
                </div>
              )}
        </div>

        {isLoading ? <p className="mt-4 text-gray-500">Loading...</p> : users.length === 0 ? 
          <p className="mt-6 text-center text-gray-500">There are no patients registered under your hospital code to manage.</p> 
          : currentPrescription && (
            <div className="mt-6 space-y-8">
                {selectedUser && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500">Patient Name</label>
                                <p className="text-sm font-semibold text-gray-800">{selectedUser.firstName} {selectedUser.lastName}</p>
                            </div>
                             <div>
                                <label className="text-xs font-medium text-gray-500">Age</label>
                                <p className="text-sm font-semibold text-gray-800">{selectedUser.age ? `${selectedUser.age} years` : 'N/A'}</p>
                            </div>
                             <div>
                                <label className="text-xs font-medium text-gray-500">Gender</label>
                                <p className="text-sm font-semibold text-gray-800 capitalize">{selectedUser.gender || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Current Medications for <span className="text-blue-600">{selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : selectedUserId}</span></h3>
                     {currentPrescription.medications.length > 0 ? (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Morning Column */}
                            <div className="bg-gray-50/50 p-4 rounded-lg border">
                                <h4 className="font-bold text-gray-800 border-b pb-2 mb-3 text-center">Morning</h4>
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {morningMeds.length > 0 ? morningMeds.map(({ med, originalIndex }) => (
                                        <div key={originalIndex} className="p-3 bg-white rounded-md border border-gray-200 shadow-sm">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{med.name} <span className="text-sm font-normal text-gray-600">({med.dosage} {getDosageUnitLabel(med.dosageUnit)})</span></p>
                                                    <p className="text-xs text-gray-500 mt-1">{getTimingLabel(med.timing)}</p>
                                                </div>
                                                <button onClick={() => handleRemoveMedication(originalIndex)} className="p-1 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 flex-shrink-0 ml-2" aria-label="Remove medication">
                                                  <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                             {med.instructions && <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md mt-2"><strong>Note:</strong> {med.instructions}</p>}
                                             <p className="text-xs text-gray-500 mt-2 pt-2 border-t">Starts: {med.startDate} &bull; For: {med.durationInDays} days</p>
                                        </div>
                                    )) : <p className="text-xs text-gray-500 text-center py-4">No medications.</p>}
                                </div>
                            </div>

                            {/* Afternoon Column */}
                            <div className="bg-gray-50/50 p-4 rounded-lg border">
                                <h4 className="font-bold text-gray-800 border-b pb-2 mb-3 text-center">Afternoon</h4>
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {afternoonMeds.length > 0 ? afternoonMeds.map(({ med, originalIndex }) => (
                                         <div key={originalIndex} className="p-3 bg-white rounded-md border border-gray-200 shadow-sm">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{med.name} <span className="text-sm font-normal text-gray-600">({med.dosage} {getDosageUnitLabel(med.dosageUnit)})</span></p>
                                                    <p className="text-xs text-gray-500 mt-1">{getTimingLabel(med.timing)}</p>
                                                </div>
                                                <button onClick={() => handleRemoveMedication(originalIndex)} className="p-1 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 flex-shrink-0 ml-2" aria-label="Remove medication">
                                                  <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                             {med.instructions && <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md mt-2"><strong>Note:</strong> {med.instructions}</p>}
                                             <p className="text-xs text-gray-500 mt-2 pt-2 border-t">Starts: {med.startDate} &bull; For: {med.durationInDays} days</p>
                                        </div>
                                    )) : <p className="text-xs text-gray-500 text-center py-4">No medications.</p>}
                                </div>
                            </div>

                            {/* Night Column */}
                             <div className="bg-gray-50/50 p-4 rounded-lg border">
                                <h4 className="font-bold text-gray-800 border-b pb-2 mb-3 text-center">Night</h4>
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {nightMeds.length > 0 ? nightMeds.map(({ med, originalIndex }) => (
                                         <div key={originalIndex} className="p-3 bg-white rounded-md border border-gray-200 shadow-sm">
                                           <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{med.name} <span className="text-sm font-normal text-gray-600">({med.dosage} {getDosageUnitLabel(med.dosageUnit)})</span></p>
                                                    <p className="text-xs text-gray-500 mt-1">{getTimingLabel(med.timing)}</p>
                                                </div>
                                                <button onClick={() => handleRemoveMedication(originalIndex)} className="p-1 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 flex-shrink-0 ml-2" aria-label="Remove medication">
                                                  <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                             {med.instructions && <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md mt-2"><strong>Note:</strong> {med.instructions}</p>}
                                             <p className="text-xs text-gray-500 mt-2 pt-2 border-t">Starts: {med.startDate} &bull; For: {med.durationInDays} days</p>
                                        </div>
                                    )) : <p className="text-xs text-gray-500 text-center py-4">No medications.</p>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 mt-4">No medications prescribed for this patient.</p>
                    )}
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Add New Medication</h3>
                        {addMedMessage && (
                            <div 
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                    addMedMessage.type === 'error' 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'bg-green-100 text-green-700'
                                } animate-fade-in-subtle`}
                            >
                                {addMedMessage.text}
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="med-name" className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                            <input id="med-name" type="text" placeholder="e.g., Triphala" value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} className={inputBaseClasses} list="ayurvedic-medicines" />
                        </div>
                        <div>
                            <label htmlFor="med-dosage" className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                            <div className="flex gap-2">
                                <input id="med-dosage" type="number" placeholder="e.g., 1" value={newMed.dosage} onChange={e => setNewMed({...newMed, dosage: e.target.value})} className={`${inputBaseClasses} w-2/3`} />
                                <select value={newMed.dosageUnit} onChange={e => setNewMed({...newMed, dosageUnit: e.target.value as DosageUnit})} className={`${inputBaseClasses} w-1/3`}>
                                    <option value={DosageUnit.TABLET}>Tablet</option>
                                    <option value={DosageUnit.ML}>ml</option>
                                    <option value={DosageUnit.TABLE_SPOON}>Table Spoon</option>
                                    <option value={DosageUnit.TEA_SPOON}>Tea Spoon</option>
                                    <option value={DosageUnit.NIL}>Nil</option>
                                </select>
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                           <fieldset>
                                <legend className="block text-sm font-medium text-gray-700 mb-2">Timing</legend>
                                <div className="flex items-center space-x-6">
                                    <div className="flex items-center">
                                        <input id="before-food" value="before" type="radio" checked={timingRelation === 'before'} onChange={e => setTimingRelation(e.target.value as 'before' | 'after' | 'empty-stomach')} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
                                        <label htmlFor="before-food" className="ml-2 block text-sm text-gray-900">Before Food</label>
                                    </div>
                                     <div className="flex items-center">
                                        <input id="after-food" value="after" type="radio" checked={timingRelation === 'after'} onChange={e => setTimingRelation(e.target.value as 'before' | 'after' | 'empty-stomach')} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
                                        <label htmlFor="after-food" className="ml-2 block text-sm text-gray-900">After Food</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input id="empty-stomach" value="empty-stomach" type="radio" checked={timingRelation === 'empty-stomach'} onChange={e => setTimingRelation(e.target.value as 'before' | 'after' | 'empty-stomach')} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
                                        <label htmlFor="empty-stomach" className="ml-2 block text-sm text-gray-900">Empty Stomach</label>
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 items-center">
                                     {['Morning', 'Afternoon', 'Night'].map(meal => (
                                        <div key={meal} className="flex items-center">
                                            <input 
                                                id={`meal-${meal}`} 
                                                type="checkbox"
                                                checked={selectedMeals[meal.toLowerCase() === 'morning' ? 'breakfast' : meal.toLowerCase() === 'afternoon' ? 'lunch' : 'night' === 'night' ? 'dinner' : 'dinner']}
                                                onChange={e => handleMealChange(meal.toLowerCase() === 'morning' ? 'breakfast' : meal.toLowerCase() === 'afternoon' ? 'lunch' : 'dinner', e.target.checked)}
                                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                            />
                                            <label htmlFor={`meal-${meal}`} className="ml-2 block text-sm text-gray-900">{meal === 'Night' ? 'Night' : meal}</label>
                                        </div>
                                    ))}
                                    <div className="flex items-center">
                                        <input 
                                            id="meal-all" 
                                            type="checkbox"
                                            checked={areAllMealsSelected}
                                            onChange={e => handleSelectAllMeals(e.target.checked)}
                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <label htmlFor="meal-all" className="ml-2 block text-sm font-medium text-gray-900">All</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input 
                                            id="meal-bedtime" 
                                            type="checkbox"
                                            checked={isBedtime}
                                            onChange={e => setIsBedtime(e.target.checked)}
                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <label htmlFor="meal-bedtime" className="ml-2 block text-sm font-medium text-gray-900">Bedtime</label>
                                    </div>
                                </div>
                           </fieldset>
                        </div>

                        <div className="sm:col-span-2">
                            <div className="relative flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="add-instructions"
                                        name="add-instructions"
                                        type="checkbox"
                                        checked={addInstructions}
                                        onChange={(e) => {
                                            setAddInstructions(e.target.checked);
                                            if (!e.target.checked) {
                                                setInstructions('');
                                                setInstructionSuggestion('');
                                            }
                                        }}
                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="add-instructions" className="font-medium text-gray-700">
                                        Add special instructions
                                    </label>
                                    <p className="text-gray-500">e.g., "Take with warm water", "Avoid citrus fruits for 1 hour".</p>
                                </div>
                            </div>
                        </div>

                        {addInstructions && (
                            <div className="sm:col-span-2 space-y-3">
                                <div>
                                    <label htmlFor="instruction-suggestion" className="block text-sm font-medium text-gray-700 mb-1">
                                        Choose a suggestion
                                    </label>
                                    <select
                                        id="instruction-suggestion"
                                        className={inputBaseClasses}
                                        value={instructionSuggestion}
                                        onChange={e => {
                                            const value = e.target.value;
                                            setInstructionSuggestion(value);
                                            if (value) {
                                                setInstructions(`Take with ${value}`);
                                            } else {
                                                setInstructions('');
                                            }
                                        }}
                                    >
                                        <option value="">Select a common instruction...</option>
                                        {instructionSuggestions.map(item => (
                                            <option key={item} value={item}>{item}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="med-instructions" className="block text-sm font-medium text-gray-700 mb-1">
                                        Instructions
                                    </label>
                                    <textarea
                                        id="med-instructions"
                                        rows={2}
                                        value={instructions}
                                        onChange={e => setInstructions(e.target.value)}
                                        className={inputBaseClasses}
                                        placeholder="Describe how to take the medicine..."
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="med-duration" className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                            <input id="med-duration" type="number" placeholder="e.g., 30" value={newMed.durationInDays} onChange={e => setNewMed({...newMed, durationInDays: parseInt(e.target.value, 10)})} className={inputBaseClasses} />
                        </div>
                        <div>
                            <label htmlFor="med-start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input id="med-start-date" type="date" value={newMed.startDate} onChange={e => setNewMed({...newMed, startDate: e.target.value})} className={inputBaseClasses} />
                        </div>
                    </div>
                     <datalist id="ayurvedic-medicines">
                        {ayurvedicMedicines.map(medName => <option key={medName} value={medName} />)}
                    </datalist>
                     <button type="button" onClick={handleAddMedication} className="mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Add Medication to List</button>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                     <label htmlFor="diet-plan" className="block text-lg font-medium text-gray-900">Diet Plan</label>
                     <textarea id="diet-plan" rows={4} value={currentPrescription.dietPlan || ''} onChange={e => setCurrentPrescription({...currentPrescription, dietPlan: e.target.value})} className={`mt-2 ${inputBaseClasses}`} placeholder="Enter diet details..."></textarea>
                </div>
                
                <div className="space-y-4">
                    {savePrescriptionMessage && <div className={`p-3 rounded-md text-sm text-center ${savePrescriptionMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{savePrescriptionMessage.text}</div>}
                    
                    <button type="button" onClick={handleSavePrescription} className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Full Prescription for {selectedUser ? selectedUser.firstName : selectedUserId}</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ManagePrescriptionsPage;