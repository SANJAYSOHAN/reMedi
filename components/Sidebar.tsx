import React from 'react';
import { View } from '../App';
import type { User } from '../types';
import { PillIcon } from './icons/PillIcon';
import { UserIcon } from './icons/UserIcon';
import { HomeIcon } from './icons/HomeIcon';
import { AdminIcon } from './icons/AdminIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { CloseIcon } from './icons/CloseIcon';
import { PrescriptionIcon } from './icons/PrescriptionIcon';
import { AppointmentIcon } from './icons/AppointmentIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';


interface SidebarProps {
  user: User;
  isAdmin: boolean;
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button 
        onClick={onClick} 
        className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-blue-300 ${
            isActive 
            ? 'bg-blue-600 text-white shadow-lg -translate-y-px' 
            : 'text-gray-600 hover:bg-blue-100 hover:text-blue-700 hover:translate-x-1'
        }`}
    >
        {icon}
        <span className="ml-4 font-semibold">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ user, isAdmin, currentView, onNavigate, onLogout, isOpen, setIsOpen }) => {
    
    const renderNavLinks = () => {
        if (user.role === 'super-admin') {
            return (
                <>
                    <NavLink
                        icon={<ShieldCheckIcon className="w-6 h-6" />}
                        label="Dashboard"
                        isActive={currentView === View.SuperAdmin}
                        onClick={() => onNavigate(View.SuperAdmin)}
                    />
                    <NavLink
                        icon={<UserIcon className="w-6 h-6" />}
                        label="Profile"
                        isActive={currentView === View.AdminProfile}
                        onClick={() => onNavigate(View.AdminProfile)}
                    />
                </>
            );
        }

        if (user.role === 'admin') {
            return (
                <>
                    <NavLink
                        icon={<AdminIcon className="w-6 h-6" />}
                        label="Dashboard"
                        isActive={currentView === View.Admin || currentView === View.PatientAdherenceCalendar}
                        onClick={() => onNavigate(View.Admin)}
                    />
                     <NavLink
                        icon={<PrescriptionIcon className="w-6 h-6" />}
                        label="Manage Prescriptions"
                        isActive={currentView === View.ManagePrescriptions}
                        onClick={() => onNavigate(View.ManagePrescriptions)}
                    />
                    <NavLink
                        icon={<AppointmentIcon className="w-6 h-6" />}
                        label="Manage Appointments"
                        isActive={currentView === View.ManageAppointments}
                        onClick={() => onNavigate(View.ManageAppointments)}
                    />
                    <NavLink
                        icon={<UserIcon className="w-6 h-6" />}
                        label="Profile"
                        isActive={currentView === View.AdminProfile}
                        onClick={() => onNavigate(View.AdminProfile)}
                    />
                </>
            );
        }

        // Patient links
        return (
            <>
                <NavLink
                    icon={<HomeIcon className="w-6 h-6" />}
                    label="Home"
                    isActive={currentView === View.Home}
                    onClick={() => onNavigate(View.Home)}
                />
                <NavLink
                    icon={<PrescriptionIcon className="w-6 h-6" />}
                    label="My Prescription"
                    isActive={currentView === View.Prescription}
                    onClick={() => onNavigate(View.Prescription)}
                />
                <NavLink
                    icon={<AppointmentIcon className="w-6 h-6" />}
                    label="Appointments"
                    isActive={currentView === View.Appointments}
                    onClick={() => onNavigate(View.Appointments)}
                />
                <NavLink
                    icon={<UserIcon className="w-6 h-6" />}
                    label="Profile"
                    isActive={currentView === View.Profile}
                    onClick={() => onNavigate(View.Profile)}
                />
            </>
        );
    };

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200/80">
                <div className="flex items-center">
                    <PillIcon className="h-8 w-8 text-blue-600" />
                    <span className="ml-2 text-xl font-bold text-gray-800">reMedi</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 rounded-md hover:bg-gray-100">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {renderNavLinks()}
            </nav>

            <div className="p-4 border-t border-gray-200/80">
                <button
                    onClick={onLogout}
                    className="flex items-center w-full px-4 py-3 text-left text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                    <LogoutIcon className="w-6 h-6" />
                    <span className="ml-4 font-semibold">Logout</span>
                </button>
            </div>
        </div>
    );

  return (
    <>
    {/* Overlay */}
    <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
    ></div>
    
    {/* Sidebar */}
    <aside className={`fixed top-0 left-0 h-full w-60 bg-white/95 backdrop-blur-lg border-r border-gray-200/80 z-40 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
    </aside>
    </>
  );
};

export default Sidebar;