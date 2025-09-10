
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { getTimingLabel } from '../utils/helpers';
import type { Medication } from '../types';

const MedicineCard: React.FC<{ med: Medication }> = ({ med }) => (
    <div className="p-3 bg-white rounded-md border border-gray-200 shadow-sm">
        <p className="font-semibold text-gray-800">{med.name}</p>
        <p className="text-sm text-gray-600">{med.dosage}</p>
        <p className="text-xs text-gray-500 mt-2 pt-2 border-t">{getTimingLabel(med.timing)}</p>
    </div>
);

const MedicinesListPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMedicines = async () => {
      setIsLoading(true);
      try {
        const prescribedMedicines = await apiService.getAllUniquePrescribedMedicines();
        setMedicines(prescribedMedicines);
      } catch (error) {
        console.error("Failed to fetch medicines list:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedicines();
  }, []);
  
  const categorizedMeds = useMemo(() => {
    const filtered = medicines.filter(med => 
      med.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const morning = filtered.filter(med => med.timing.includes('breakfast')).sort((a,b) => a.name.localeCompare(b.name));
    const afternoon = filtered.filter(med => med.timing.includes('lunch')).sort((a,b) => a.name.localeCompare(b.name));
    const night = filtered.filter(med => med.timing.includes('dinner')).sort((a,b) => a.name.localeCompare(b.name));

    return { morning, afternoon, night, totalFiltered: filtered.length, totalCount: medicines.length };
  }, [medicines, searchQuery]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-gray-800">Medicines Reference</h1>
        <p className="text-lg text-gray-600 mt-1">A reference list of all unique medicines prescribed in the system.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="mb-6">
          <label htmlFor="search-med" className="sr-only">Search Medicines</label>
          <input
            id="search-med"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for a medicine..."
            className="block w-full max-w-sm px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 py-10">Loading medicines...</p>
        ) : categorizedMeds.totalCount > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50/50 p-4 rounded-lg border">
                    <h4 className="font-bold text-gray-800 border-b pb-2 mb-3 text-center">Morning</h4>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {categorizedMeds.morning.length > 0 ? categorizedMeds.morning.map((med) => (
                            <MedicineCard key={`${med.name}-${med.dosage}-${med.timing}`} med={med} />
                        )) : <p className="text-xs text-gray-500 text-center py-4">No medicines found.</p>}
                    </div>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-lg border">
                    <h4 className="font-bold text-gray-800 border-b pb-2 mb-3 text-center">Afternoon</h4>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                         {categorizedMeds.afternoon.length > 0 ? categorizedMeds.afternoon.map((med) => (
                            <MedicineCard key={`${med.name}-${med.dosage}-${med.timing}`} med={med} />
                        )) : <p className="text-xs text-gray-500 text-center py-4">No medicines found.</p>}
                    </div>
                </div>

                 <div className="bg-gray-50/50 p-4 rounded-lg border">
                    <h4 className="font-bold text-gray-800 border-b pb-2 mb-3 text-center">Night</h4>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                         {categorizedMeds.night.length > 0 ? categorizedMeds.night.map((med) => (
                           <MedicineCard key={`${med.name}-${med.dosage}-${med.timing}`} med={med} />
                        )) : <p className="text-xs text-gray-500 text-center py-4">No medicines found.</p>}
                    </div>
                </div>
            </div>
        ) : (
          <p className="text-center text-gray-500 py-10">
             No medicines have been prescribed by any admin yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default MedicinesListPage;
