
import React from 'react';
import type { User, Prescription, Medication } from '../types';
import { PillIcon } from './icons/PillIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { getTimingLabel, getDosageUnitLabel, dateFromYMDString } from '../utils/helpers';

interface PrescriptionPageProps {
  user: User;
  prescription: Prescription | null;
}

const getStatus = (med: Medication) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const startDate = dateFromYMDString(med.startDate);
    const endDate = new Date(startDate.getTime());
    endDate.setDate(startDate.getDate() + med.durationInDays - 1); // Inclusive end date

    if (today < startDate) {
        return { text: `Starts on ${med.startDate}`, color: 'text-yellow-700 bg-yellow-100' };
    }
    if (today > endDate) {
        return { text: 'Finished', color: 'text-gray-600 bg-gray-100' };
    }
    return { text: 'Active', color: 'text-green-700 bg-green-100' };
};


const MedicationCard: React.FC<{ med: Medication }> = ({ med }) => {
    const status = getStatus(med);
    const dosageUnitLabel = getDosageUnitLabel(med.dosageUnit);
    return (
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between transition-all hover:shadow-lg hover:border-blue-200">
            <div>
                <div className="flex items-start justify-between">
                    <div>
                        <p className="font-bold text-lg text-gray-800">{med.name}</p>
                        <p className="text-sm text-gray-600">{med.dosage} {dosageUnitLabel}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                        {status.text}
                    </span>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500 space-y-1.5">
                <p><span className="font-medium text-gray-600">Timing:</span> {getTimingLabel(med.timing)}</p>
                <p><span className="font-medium text-gray-600">Duration:</span> {med.durationInDays} days (from {med.startDate})</p>
                {med.instructions && (
                    <p className="text-blue-700"><span className="font-medium">Instructions:</span> {med.instructions}</p>
                )}
            </div>
        </div>
    );
};


const PrescriptionPage: React.FC<PrescriptionPageProps> = ({ user, prescription }) => {

    if (!prescription || prescription.medications.length === 0) {
        return (
            <div className="text-center p-10 bg-white rounded-xl shadow-lg border border-gray-100">
                <PillIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-700">No Prescription Found</h2>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">Your doctor has not uploaded a prescription for you yet. Please check back later or contact your provider.</p>
            </div>
        );
    }
    
    const morningMeds = prescription.medications.filter(med => med.timing.includes('breakfast'));
    const afternoonMeds = prescription.medications.filter(med => med.timing.includes('lunch'));
    const nightMeds = prescription.medications.filter(med => med.timing.includes('dinner'));

    return (
        <div className="space-y-8">
            <div>
                <p className="text-lg text-gray-600">Full details of your prescribed medications and diet plan.</p>
            </div>
            
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">Medications</h2>
                
                {morningMeds.length > 0 && (
                    <section>
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Morning</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {morningMeds.map((med, index) => <MedicationCard key={`${med.name}-${index}-morning`} med={med} />)}
                        </div>
                    </section>
                )}
                
                {afternoonMeds.length > 0 && (
                     <section>
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Afternoon</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {afternoonMeds.map((med, index) => <MedicationCard key={`${med.name}-${index}-afternoon`} med={med} />)}
                        </div>
                    </section>
                )}

                {nightMeds.length > 0 && (
                     <section>
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Night</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {nightMeds.map((med, index) => <MedicationCard key={`${med.name}-${index}-night`} med={med} />)}
                        </div>
                    </section>
                )}
            </div>

            {prescription.dietPlan && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
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

export default PrescriptionPage;
