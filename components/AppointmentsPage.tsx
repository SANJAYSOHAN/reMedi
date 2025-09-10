import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { User, Appointment } from '../types';
import { apiService } from '../services/api';
import { CalendarIcon } from './icons/CalendarIcon';
import { ClockIcon } from './icons/ClockIcon';
import { formatTime12Hour, dateFromYMDString, toYMDString } from '../utils/helpers';
import TimePicker from './TimePicker';

interface AppointmentsPageProps {
  user: User;
}

const AppointmentCard: React.FC<{ appt: Appointment, user: User, onCancel: (id: string) => void, onEdit: (appt: Appointment) => void }> = ({ appt, user, onCancel, onEdit }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const apptDate = dateFromYMDString(appt.date);
    const isPast = apptDate < today;
    
    const statusPill = useMemo(() => {
        switch (appt.status) {
            case 'scheduled': return isPast ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
        }
    }, [appt.status, isPast]);
    
    const statusText = isPast && appt.status === 'scheduled' ? 'Missed' : appt.status;

    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:border-blue-200">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg text-gray-800">{appt.reason}</p>
                    <p className="text-sm text-gray-500">With {user.hospitalName || 'the clinic'}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${statusPill}`}>{statusText}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span>{apptDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span>{formatTime12Hour(appt.time)}</span>
                    </div>
                </div>
                {!isPast && appt.status === 'scheduled' && (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => onEdit(appt)} className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors">
                            Edit
                        </button>
                        <button onClick={() => onCancel(appt.id)} className="text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors">
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const BookingModal: React.FC<{ user: User, isOpen: boolean, onClose: () => void, onSaved: () => void, appointmentToEdit: Appointment | null }> = ({ user, isOpen, onClose, onSaved, appointmentToEdit }) => {
    const isEditMode = !!appointmentToEdit;
    
    const [date, setDate] = useState(toYMDString(new Date()));
    const [time, setTime] = useState('09:00');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (isOpen) {
        if (appointmentToEdit) {
            setDate(appointmentToEdit.date);
            setTime(appointmentToEdit.time);
            setReason(appointmentToEdit.reason);
        } else {
            // Reset to defaults for new booking
            setDate(toYMDString(new Date()));
            setTime('09:00');
            setReason('');
        }
        setError('');
      }
    }, [isOpen, appointmentToEdit]);
    

    if (!isOpen) return null;
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!date || !time || !reason) {
            setError('All fields are required.');
            return;
        }
        setLoading(true);
        try {
            if (isEditMode && appointmentToEdit) {
                await apiService.updateAppointment(appointmentToEdit.id, { date, time, reason });
            } else {
                await apiService.createAppointment({
                    patientId: user.id,
                    date,
                    time,
                    reason,
                    patient: user
                });
            }
            onSaved();
            onClose();
        } catch (err) {
            setError(`Failed to ${isEditMode ? 'update' : 'book'} appointment. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-fade-in-up">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">{isEditMode ? 'Edit Appointment' : 'Book an Appointment'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="appt-date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input id="appt-date" type="date" value={date} onChange={e => setDate(e.target.value)} min={toYMDString(new Date())} required className="w-full p-2 border border-gray-300 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <TimePicker value={time} onChange={setTime} />
                            </div>
                             <div>
                                <label htmlFor="appt-reason" className="block text-sm font-medium text-gray-700 mb-1">Reason for visit</label>
                                <textarea id="appt-reason" value={reason} onChange={e => setReason(e.target.value)} required rows={3} className="w-full p-2 border border-gray-300 rounded-md" placeholder="e.g., Follow-up checkup"></textarea>
                            </div>
                             {error && <p className="text-sm text-red-600">{error}</p>}
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">
                            {loading ? 'Saving...' : (isEditMode ? 'Update Appointment' : 'Book Appointment')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AppointmentsPage: React.FC<AppointmentsPageProps> = ({ user }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    const fetchAppointments = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getAppointmentsForPatient(user.id);
            setAppointments(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setIsLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleCancelAppointment = async (appointmentId: string) => {
        if (window.confirm('Are you sure you want to cancel this appointment?')) {
            try {
                await apiService.updateAppointmentStatus(appointmentId, 'cancelled');
                fetchAppointments(); // Refresh list
            } catch (error) {
                console.error("Failed to cancel appointment", error);
                alert("Could not cancel the appointment. Please try again.");
            }
        }
    };

    const handleOpenEditModal = (appt: Appointment) => {
        setEditingAppointment(appt);
        setIsBookingModalOpen(true);
    };

    const handleOpenCreateModal = () => {
        setEditingAppointment(null);
        setIsBookingModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsBookingModalOpen(false);
        setEditingAppointment(null);
    };


    const { upcoming, past } = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);
        return appointments.reduce((acc, appt) => {
            const apptDate = dateFromYMDString(appt.date);
            if (apptDate >= today && appt.status === 'scheduled') {
                acc.upcoming.push(appt);
            } else {
                acc.past.push(appt);
            }
            return acc;
        }, { upcoming: [] as Appointment[], past: [] as Appointment[] });
    }, [appointments]);

    return (
        <>
            <div className="space-y-8">
                <div className="flex justify-between items-center gap-4">
                    <div>
                        <p className="text-lg text-gray-600 mt-1">Manage your upcoming and view past appointments.</p>
                    </div>
                    <button onClick={handleOpenCreateModal} className="px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md focus:outline-none focus:ring-4 focus:ring-blue-300 flex-shrink-0">
                        Book New Appointment
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500">Loading appointments...</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-xl font-bold text-gray-800">Upcoming Appointments</h2>
                            {upcoming.length > 0 ? (
                                <div className="mt-4 space-y-4">
                                    {upcoming.map(appt => (
                                        <AppointmentCard key={appt.id} appt={appt} user={user} onCancel={handleCancelAppointment} onEdit={handleOpenEditModal} />
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4 text-center text-gray-500 bg-gray-50 p-6 rounded-lg">
                                    <p>You have no upcoming appointments.</p>
                                </div>
                            )}
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800">Past Appointments</h2>
                            {past.length > 0 ? (
                                <div className="mt-4 space-y-4">
                                    {past.map(appt => (
                                        <AppointmentCard key={appt.id} appt={appt} user={user} onCancel={handleCancelAppointment} onEdit={handleOpenEditModal} />
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4 text-center text-gray-500 bg-gray-50 p-6 rounded-lg">
                                    <p>You have no past appointment records.</p>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>

            <BookingModal
                user={user}
                isOpen={isBookingModalOpen}
                onClose={handleCloseModal}
                onSaved={fetchAppointments}
                appointmentToEdit={editingAppointment}
            />
        </>
    );
};

// FIX: Added default export to resolve module import error.
export default AppointmentsPage;
