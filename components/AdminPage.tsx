import React, { useState, useEffect, useCallback } from 'react';
import type { User, MedicationLog } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { EyeIcon } from './icons/EyeIcon';
import { toYMDString } from '../utils/helpers';

interface AdminPageProps {
  onViewAdherenceCalendar: (user: User) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onViewAdherenceCalendar }) => {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<Record<string, MedicationLog[]>>({});

  const fetchData = useCallback(async () => {
    if (!adminUser || !adminUser.hospitalCode) return;
    const patientUsers = await apiService.getPatientsByHospitalCode(adminUser.hospitalCode);
    const allLogs = await apiService.getAllLogs();
    setUsers(patientUsers);
    setLogs(allLogs);
  }, [adminUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAdherenceRate = (userId: string) => {
      const userLogs = logs[userId] || [];
      const today = toYMDString(new Date());
      const todayLogs = userLogs.filter(log => log.date === today);
      const takenCount = todayLogs.filter(log => log.status === 'taken').length;
      return takenCount > 0 ? (
          <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              {takenCount} dose(s) taken
          </span>
      ) : (
          <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
              0 doses taken
          </span>
      );
  }

  return (
    <div className="space-y-8">
      <div>
        {adminUser?.hospitalName && (
          <p className="text-lg text-gray-600">
              Managing patients for: <span className="font-semibold text-blue-600">{adminUser.hospitalName}</span>
          </p>
        )}
        {adminUser?.hospitalCode && (
          <p className="text-sm text-gray-500 mt-1">
              Hospital Code: <span className="font-semibold font-mono text-gray-700 bg-gray-200 px-2 py-0.5 rounded-md">{adminUser.hospitalCode}</span>
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900">Patient Adherence Tracking</h2>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Adherence</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {users.length > 0 ? users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div>{user.firstName} {user.lastName}</div>
                                <div className="text-xs text-gray-500 font-mono">{user.id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.age ? `${user.age} yrs, ` : ''} <span className="capitalize">{user.gender || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {getAdherenceRate(user.id)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button 
                                    onClick={() => onViewAdherenceCalendar(user)}
                                    className="flex items-center px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                                    aria-label={`View adherence calendar for ${user.firstName} ${user.lastName}`}
                                >
                                    <EyeIcon className="w-4 h-4 mr-1.5" />
                                    <span>View Calendar</span>
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={5} className="text-center py-16 text-gray-500">
                                <p className="font-semibold">No Patients Found</p>
                                <p className="text-sm">No patients have registered with your hospital code yet.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;