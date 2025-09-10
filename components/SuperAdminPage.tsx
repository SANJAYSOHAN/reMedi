import React, { useState, useEffect, useMemo } from 'react';
import type { User } from '../types';
import { apiService } from '../services/api';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { UsersGroupIcon } from './icons/UsersGroupIcon';

const SuperAdminPage: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllUsers = async () => {
      setIsLoading(true);
      try {
        const users = await apiService.getAllUsers();
        setAllUsers(users);
      } catch (error) {
        console.error("Failed to fetch all users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllUsers();
  }, []);

  const { admins, patientsCount, adminBreakdown } = useMemo(() => {
    const allAdmins = allUsers.filter(u => u.role === 'admin');
    const allPatients = allUsers.filter(u => u.role === 'patient');

    const breakdown = allAdmins.map(admin => {
      const patientCount = allPatients.filter(patient => patient.hospitalCode === admin.hospitalCode).length;
      return { ...admin, patientCount };
    }).sort((a,b) => (a.hospitalName || '').localeCompare(b.hospitalName || ''));

    return { 
        admins: allAdmins, 
        patientsCount: allPatients.length, 
        adminBreakdown: breakdown 
    };
  }, [allUsers]);


  if (isLoading) {
    return <div className="text-center p-10">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Platform Overview</h1>
        <p className="text-gray-600">Global statistics for all registered hospitals and patients.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-center">
          <div className="bg-blue-100 p-4 rounded-full">
            <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Admins</p>
            <p className="text-3xl font-bold text-gray-900">{admins.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-center">
          <div className="bg-green-100 p-4 rounded-full">
            <UsersGroupIcon className="w-8 h-8 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Patients</p>
            <p className="text-3xl font-bold text-gray-900">{patientsCount}</p>
          </div>
        </div>
      </div>

      {/* Admin & Hospital Breakdown Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900">Admin & Hospital Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital Information</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Phone</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. of Patients</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adminBreakdown.length > 0 ? adminBreakdown.map(admin => (
                <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{admin.firstName} {admin.lastName}</div>
                    <div className="text-sm text-gray-500 font-mono">{admin.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{admin.hospitalName}</div>
                    <div className="text-sm text-gray-500 font-mono">{admin.hospitalCode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {admin.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {admin.patientCount}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-gray-500">
                    <p className="font-semibold">No Admins Found</p>
                    <p className="text-sm">No admin users have registered yet.</p>
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

export default SuperAdminPage;