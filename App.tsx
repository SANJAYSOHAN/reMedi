import React, { useState, useEffect, useCallback } from 'react';
import AuthPage from './components/AuthPage';
import HomePage from './components/HomePage';
import AdminPage from './components/AdminPage';
import ProfilePage from './components/ProfilePage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import type { User, Prescription } from './types';
import { apiService } from './services/api';
import ManagePrescriptionsPage from './components/ManagePrescriptionsPage';
import AdminProfilePage from './components/AdminProfilePage';
import PrescriptionPage from './components/PrescriptionPage';
import AppointmentsPage from './components/AppointmentsPage';
import ManageAppointmentsPage from './components/ManageAppointmentsPage';
import PatientAdherenceCalendarPage from './components/PatientAdherenceCalendarPage';
import SuperAdminPage from './components/SuperAdminPage';


export enum View {
  Auth = 'AUTH',
  Home = 'HOME',
  Profile = 'PROFILE',
  Prescription = 'PRESCRIPTION',
  Appointments = 'APPOINTMENTS',
  Admin = 'ADMIN',
  ManagePrescriptions = 'MANAGE_PRESCRIPTIONS',
  AdminProfile = 'ADMIN_PROFILE',
  ManageAppointments = 'MANAGE_APPOINTMENTS',
  PatientAdherenceCalendar = 'PATIENT_ADHERENCE_CALENDAR',
  SuperAdmin = 'SUPER_ADMIN',
}

const App: React.FC = () => {
  const { user, login, logout, isAdmin, setIsAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.Auth);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);


  useNotifications(user, prescription);

  useEffect(() => {
    if (user) {
      if (user.role === 'super-admin') {
        setCurrentView(View.SuperAdmin);
      } else if (isAdmin) {
        setCurrentView(View.Admin);
      } else {
        setCurrentView(View.Home);
      }
    } else {
      setCurrentView(View.Auth);
    }
  }, [user, isAdmin]);
  
  const fetchPrescription = useCallback(async () => {
    if (user && !isAdmin) {
      const p = await apiService.getPrescription(user.id);
      setPrescription(p);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchPrescription();
  }, [fetchPrescription]);


  const handleLogin = (loggedInUser: User) => {
    login(loggedInUser);
    if (loggedInUser.role === 'super-admin') {
      setIsAdmin(true); // Super admin is also an admin type
      setCurrentView(View.SuperAdmin);
    } else if (loggedInUser.role === 'admin') {
      setIsAdmin(true);
      setCurrentView(View.Admin);
    } else {
      setIsAdmin(false);
      fetchPrescription();
      setCurrentView(View.Home);
    }
  };

  const handleLogout = () => {
    logout();
    setPrescription(null);
    setCurrentView(View.Auth);
  };

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    setSidebarOpen(false); // Close sidebar on navigation
  }

  const handleViewAdherenceCalendar = (patient: User) => {
    setSelectedPatient(patient);
    setCurrentView(View.PatientAdherenceCalendar);
  };

  const renderView = () => {
    if (!user) {
        return <AuthPage onLogin={handleLogin} />;
    }
    switch (currentView) {
      case View.Auth:
        return <AuthPage onLogin={handleLogin} />;
      case View.Home:
        return <HomePage user={user} prescription={prescription} />;
      case View.Prescription:
        return <PrescriptionPage user={user} prescription={prescription} />;
       case View.Appointments:
        return <AppointmentsPage user={user} />;
      case View.Admin:
        return <AdminPage onViewAdherenceCalendar={handleViewAdherenceCalendar} />;
      case View.ManagePrescriptions:
        return <ManagePrescriptionsPage />;
       case View.ManageAppointments:
        return <ManageAppointmentsPage user={user} />;
      case View.Profile:
        return <ProfilePage user={user} onSave={() => setCurrentView(View.Home)} />;
      case View.AdminProfile:
        return <AdminProfilePage user={user} onSave={() => setCurrentView(user.role === 'super-admin' ? View.SuperAdmin : View.Admin)} />;
      case View.PatientAdherenceCalendar:
        return selectedPatient && <PatientAdherenceCalendarPage patient={selectedPatient} onBack={() => handleNavigate(View.Admin)} />;
      case View.SuperAdmin:
        return <SuperAdminPage />;
      default:
        return <AuthPage onLogin={handleLogin} />;
    }
  };

  if (!user) {
    return (
      <main>{renderView()}</main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        user={user} 
        isAdmin={isAdmin}
        currentView={currentView}
        onNavigate={handleNavigate} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col bg-[var(--color-bg)]">
         <Header 
            user={user}
            currentView={currentView}
            toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;