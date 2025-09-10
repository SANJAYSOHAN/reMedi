
import React from 'react';
import { View } from '../App';
import { MenuIcon } from './icons/MenuIcon';
import type { User } from '../types';

interface HeaderProps {
  user: User;
  currentView: View;
  toggleSidebar: () => void;
}

const getTitle = (view: View) => {
    switch (view) {
        case View.Home:
            return "Today's Schedule";
        case View.Profile:
            return "Profile & Settings";
        case View.Prescription:
            return "My Prescription";
        case View.Appointments:
            return "My Appointments";
        case View.Admin:
            return "Admin Dashboard";
        case View.ManagePrescriptions:
            return "Manage Prescriptions";
        case View.ManageAppointments:
            return "Manage Appointments";
        case View.AdminProfile:
            return "Profile & Settings";
        case View.PatientAdherenceCalendar:
            return "Patient Adherence Calendar";
        case View.SuperAdmin:
            return "Super Admin Dashboard";
        default:
            return "reMedi";
    }
}

const Header: React.FC<HeaderProps> = ({ user, currentView, toggleSidebar }) => {
  const getInitials = (firstName?: string, lastName?: string) => {
      return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  return (
    <header className="bg-white/70 backdrop-blur-md sticky top-0 z-20 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
             <button onClick={toggleSidebar} className="p-2 rounded-md text-gray-600 hover:bg-gray-100 mr-2">
                 <MenuIcon className="h-6 w-6"/>
             </button>
             <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">
              {getTitle(currentView)}
            </h1>
          </div>
          <div className="flex items-center">
             <div className="flex items-center space-x-3">
                <span className="hidden sm:inline text-sm font-medium text-gray-700 text-right">
                    <span className="block">{user.firstName ? `${user.firstName} ${user.lastName}` : user.id}</span>
                    <span className="block text-xs text-gray-500 capitalize">{user.role}</span>
                </span>
                {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                ) : (
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
                        {getInitials(user.firstName, user.lastName)}
                    </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
