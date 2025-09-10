import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { User, Appointment } from '../types';
import { apiService } from '../services/api';
import { formatTime12Hour, dateFromYMDString, toYMDString } from '../utils/helpers';
import CalendarView from './CalendarView';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';


interface ManageAppointmentsPageProps {
  user: User;
}

const ManageAppointmentsPage: React.FC<ManageAppointmentsPageProps> = ({ user: adminUser }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | Appointment['status']>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    const fetchAppointments = useCallback(async () => {
        if (!adminUser.hospitalCode) return;
        setIsLoading(true);
        try {
            const data = await apiService.getAppointmentsForAdmin(adminUser.hospitalCode);
            setAppointments(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setIsLoading(false);
        }
    }, [adminUser.hospitalCode]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleUpdateStatus = async (appointmentId: string, status: Appointment['status']) => {
        try {
            await apiService.updateAppointmentStatus(appointmentId, status);
            fetchAppointments(); // Refresh list
        } catch (error)
        {
            console.error(`Failed to update appointment status to ${status}`, error);
            alert(`Could not update the appointment. Please try again.`);
        }
    };
    
    const filteredAppointments = useMemo(() => {
        return appointments.filter(appt => {
            // Status filter
            if (statusFilter !== 'all' && appt.status !== statusFilter) {
                return false;
            }
            // Search query filter
            if (searchQuery && !appt.patientName.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            // Date range filter (using direct string comparison for YYYY-MM-DD)
            if (startDate && appt.date < startDate) {
                return false;
            }
            if (endDate && appt.date > endDate) {
                return false;
            }
            return true;
        });
    }, [appointments, statusFilter, searchQuery, startDate, endDate]);

    const handleResetFilters = () => {
        setStatusFilter('all');
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
    };
    
    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setIsModalOpen(true);
    };

    const appointmentsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = toYMDString(selectedDate);
        return filteredAppointments.filter(appt => appt.date === dateStr);
    }, [selectedDate, filteredAppointments]);


    const FilterButton: React.FC<{ status: typeof statusFilter, label: string }> = ({ status, label }) => (
        <button 
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === status 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border'
            }`}
        >
            {label}
        </button>
    );

    const getStatusPill = (status: Appointment['status']) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
        }
    };

    const inputStyles = "w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm";
    
    const renderModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Appointments for {selectedDate?.toLocaleDateString()}</h3>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100">X</button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {appointmentsForSelectedDate.length > 0 ? appointmentsForSelectedDate.map(appt => (
                            <div key={appt.id} className="p-3 border rounded-lg bg-gray-50">
                                <p className="font-semibold">{appt.patientName}</p>
                                <p className="text-sm text-gray-600">{appt.reason}</p>
                                <p className="text-sm text-gray-500 mt-1">{formatTime12Hour(appt.time)}</p>
                            </div>
                        )) : <p>No appointments for this day.</p>}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-200">
                    <div className="lg:col-span-2">
                        <label htmlFor="patient-search" className="block text-sm font-medium text-gray-700 mb-1">Search Patient</label>
                        <input
                            id="patient-search"
                            type="text"
                            placeholder="Patient name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={inputStyles}
                        />
                    </div>
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={inputStyles}
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={inputStyles}
                        />
                    </div>
                </div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                    <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
                    <FilterButton status="all" label="All" />
                    <FilterButton status="scheduled" label="Scheduled" />
                    <FilterButton status="completed" label="Completed" />
                    <FilterButton status="cancelled" label="Cancelled" />
                    <button onClick={handleResetFilters} className="text-sm font-medium text-blue-600 hover:underline px-3 py-1.5 rounded-md transition-colors">
                        Reset
                    </button>
                    <div className="flex-grow flex justify-end">
                        <div className="inline-flex rounded-md shadow-sm">
                            <button onClick={() => setViewMode('list')} className={`px-4 py-2 text-sm font-medium border rounded-l-lg ${viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                                <ListBulletIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 text-sm font-medium border rounded-r-lg ${viewMode === 'calendar' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                                <CalendarDaysIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {viewMode === 'list' ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="text-center py-10 text-gray-500">Loading...</td></tr>
                                ) : filteredAppointments.length > 0 ? filteredAppointments.map(appt => (
                                    <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appt.patientName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {dateFromYMDString(appt.date).toLocaleDateString()} at {formatTime12Hour(appt.time)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{appt.reason}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusPill(appt.status)}`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {appt.status === 'scheduled' && (
                                                <>
                                                    <button onClick={() => handleUpdateStatus(appt.id, 'completed')} className="text-green-600 hover:text-green-900 font-semibold">Complete</button>
                                                    <button onClick={() => handleUpdateStatus(appt.id, 'cancelled')} className="text-red-600 hover:text-red-900 font-semibold">Cancel</button>
                                                </>
                                            )}
                                            {appt.status !== 'scheduled' && (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="text-center py-16 text-gray-500">
                                        <p className="font-semibold">No Appointments Found</p>
                                        <p className="text-sm">No appointments match the current filters.</p>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <CalendarView appointments={filteredAppointments} onDayClick={handleDayClick} />
            )}
            
            {isModalOpen && renderModal()}
        </div>
    );
};

export default ManageAppointmentsPage;