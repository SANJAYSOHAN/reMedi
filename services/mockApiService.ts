import type { User, Prescription, MedicationLog, Medication, Appointment, UpdateAppointmentData } from '../types';
import { MedicationTiming, DosageUnit } from '../types';
import { toYMDString } from '../utils/helpers';

const USERS_KEY = 'mediremindo_users';
const PRESCRIPTIONS_KEY = 'mediremindo_prescriptions';
const LOGS_KEY = 'mediremindo_logs';
const APPOINTMENTS_KEY = 'mediremindo_appointments';


const getFromStorage = <T,>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return null;
  }
};

const saveToStorage = <T,>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage key “${key}”:`, error);
  }
};

// Seed initial admin and a sample user
const seedInitialData = () => {
    const users = getFromStorage<Record<string, User>>(USERS_KEY) || {};
    if (!users['superadmin']) {
        users['superadmin'] = { 
            id: 'superadmin', 
            mpin: '0000',
            role: 'super-admin',
            firstName: 'Super',
            lastName: 'Admin',
            mealTimings: { breakfast: '08:00', lunch: '13:00', dinner: '19:00' } 
        };
    }
    if (!users['admin']) {
        users['admin'] = { 
            id: 'admin', 
            mpin: '0000',
            role: 'admin',
            hospitalCode: 'HOSP101',
            hospitalName: 'reMedi General Hospital',
            firstName: 'Admin',
            lastName: 'User',
            phone: '9876543210',
            mealTimings: { breakfast: '08:00', lunch: '13:00', dinner: '19:00' } 
        };
    }
    if (!users['patient123']) {
        users['patient123'] = { 
            id: 'patient123', 
            mpin: '1234', 
            role: 'patient',
            hospitalCode: 'HOSP101',
            firstName: 'John',
            lastName: 'Doe',
            phone: '1234567890',
            age: 55,
            gender: 'male',
            mealTimings: { breakfast: '08:30', lunch: '12:30', dinner: '19:30' } 
        };
    }
    saveToStorage(USERS_KEY, users);

    const prescriptions = getFromStorage<Record<string, Prescription>>(PRESCRIPTIONS_KEY) || {};
    if (!prescriptions['patient123']) {
        prescriptions['patient123'] = {
            userId: 'patient123',
            medications: [
                { name: 'Metformin', dosage: '1', dosageUnit: DosageUnit.TABLET, timing: MedicationTiming.AfterBreakfast, startDate: toYMDString(new Date()), durationInDays: 30 },
                { name: 'Amlodipine', dosage: '1', dosageUnit: DosageUnit.TABLET, timing: MedicationTiming.BeforeBreakfast, startDate: toYMDString(new Date()), durationInDays: 30 },
                { name: 'Atorvastatin', dosage: '1', dosageUnit: DosageUnit.TABLET, timing: MedicationTiming.AfterDinner, startDate: toYMDString(new Date()), durationInDays: 60 },
                { name: 'Ashwagandha', dosage: '1', dosageUnit: DosageUnit.TABLET, timing: MedicationTiming.BeforeBreakfast, startDate: toYMDString(new Date()), durationInDays: 60, instructions: 'Take with warm milk.' },
                { name: 'Ashwagandha', dosage: '1', dosageUnit: DosageUnit.TABLET, timing: MedicationTiming.BeforeDinner, startDate: toYMDString(new Date()), durationInDays: 60, instructions: 'Take with warm milk.' },
            ],
            dietPlan: 'Low-sodium, low-sugar diet. Focus on whole grains, fruits, and vegetables.'
        };
    }
    saveToStorage(PRESCRIPTIONS_KEY, prescriptions);

    const appointments = getFromStorage<Appointment[]>(APPOINTMENTS_KEY) || [];
    if (appointments.length === 0) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        appointments.push({
            id: `appt_${Date.now()}`,
            patientId: 'patient123',
            patientName: 'John Doe',
            adminId: 'admin',
            hospitalCode: 'HOSP101',
            date: toYMDString(tomorrow),
            time: '10:00',
            reason: 'Follow-up checkup for blood pressure.',
            status: 'scheduled',
        });
         appointments.push({
            id: `appt_${Date.now()+1}`,
            patientId: 'patient123',
            patientName: 'John Doe',
            adminId: 'admin',
            hospitalCode: 'HOSP101',
            date: '2023-10-20',
            time: '14:30',
            reason: 'Annual physical exam.',
            status: 'completed',
        });
    }
    saveToStorage(APPOINTMENTS_KEY, appointments);
};

seedInitialData();

export const mockApiService = {
  async register(user: User): Promise<{ user: User | null, error?: string }> {
    const users = getFromStorage<Record<string, User>>(USERS_KEY) || {};
    if (users[user.id]) {
      return { user: null, error: 'User ID already exists. Please choose another one.' };
    }

    if (user.role === 'admin') {
      let hospitalCode;
      do {
        hospitalCode = `HOSP${Math.floor(1000 + Math.random() * 9000)}`;
      } while (Object.values(users).some(u => u.hospitalCode === hospitalCode));
      user.hospitalCode = hospitalCode;
    } else { // patient role
      if (!user.hospitalCode) {
        return { user: null, error: 'Hospital Code is required for patient registration.' };
      }
      const adminExists = Object.values(users).some(u => u.role === 'admin' && u.hospitalCode === user.hospitalCode);
      if (!adminExists) {
        return { user: null, error: 'Invalid Hospital Code. Please check the code and try again.' };
      }
    }

    users[user.id] = user;
    saveToStorage(USERS_KEY, users);
    return { user };
  },

  async login(id: string, mpin: string): Promise<User | null> {
    const users = getFromStorage<Record<string, User>>(USERS_KEY) || {};
    const user = users[id];
    if (user && user.mpin === mpin) {
      return user;
    }
    return null;
  },

  async updateUser(oldId: string, updatedUser: User): Promise<User | null> {
    const users = getFromStorage<Record<string, User>>(USERS_KEY) || {};
    const newId = updatedUser.id;

    // If ID is unchanged, just update the data
    if (oldId === newId) {
        users[oldId] = updatedUser;
        saveToStorage(USERS_KEY, users);
        return updatedUser;
    }

    // If ID has changed, perform migration
    // 1. Check if new ID already exists
    if (users[newId]) {
        return null; // New ID is already taken
    }

    // 2. Migrate user data
    delete users[oldId];
    users[newId] = updatedUser;
    saveToStorage(USERS_KEY, users);

    // 3. Migrate prescription data
    const prescriptions = getFromStorage<Record<string, Prescription>>(PRESCRIPTIONS_KEY) || {};
    if (prescriptions[oldId]) {
        const prescription = prescriptions[oldId];
        prescription.userId = newId;
        delete prescriptions[oldId];
        prescriptions[newId] = prescription;
        saveToStorage(PRESCRIPTIONS_KEY, prescriptions);
    }

    // 4. Migrate logs data
    const allLogs = getFromStorage<Record<string, MedicationLog[]>>(LOGS_KEY) || {};
    if (allLogs[oldId]) {
        const logs = allLogs[oldId];
        delete allLogs[oldId];
        allLogs[newId] = logs;
        saveToStorage(LOGS_KEY, allLogs);
    }

    return updatedUser;
  },

  async getPrescription(userId: string): Promise<Prescription | null> {
    const prescriptions = getFromStorage<Record<string, Prescription>>(PRESCRIPTIONS_KEY) || {};
    return prescriptions[userId] || null;
  },

  async savePrescription(prescription: Prescription): Promise<Prescription> {
    const prescriptions = getFromStorage<Record<string, Prescription>>(PRESCRIPTIONS_KEY) || {};
    prescriptions[prescription.userId] = prescription;
    saveToStorage(PRESCRIPTIONS_KEY, prescriptions);
    return prescription;
  },

  async logMedication(userId: string, log: MedicationLog): Promise<MedicationLog> {
    const allLogs = getFromStorage<Record<string, MedicationLog[]>>(LOGS_KEY) || {};
    if (!allLogs[userId]) {
      allLogs[userId] = [];
    }
    allLogs[userId].push(log);
    saveToStorage(LOGS_KEY, allLogs);
    return log;
  },

  async getMedicationLogs(userId: string): Promise<MedicationLog[]> {
    const allLogs = getFromStorage<Record<string, MedicationLog[]>>(LOGS_KEY) || {};
    return allLogs[userId] || [];
  },

  async getPatientsByHospitalCode(hospitalCode: string): Promise<User[]> {
      const users = getFromStorage<Record<string, User>>(USERS_KEY) || {};
      return Object.values(users).filter(u => u.role === 'patient' && u.hospitalCode === hospitalCode);
  },

  async getAdminByHospitalCode(hospitalCode: string): Promise<{ hospitalName: string; adminName: string } | null> {
    const users = getFromStorage<Record<string, User>>(USERS_KEY) || {};
    const admin = Object.values(users).find(u => u.role === 'admin' && u.hospitalCode === hospitalCode);
    if (admin) {
        return {
            hospitalName: admin.hospitalName || 'Unnamed Hospital',
            adminName: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Admin'
        };
    }
    return null;
  },

  async getAllLogs(): Promise<Record<string, MedicationLog[]>> {
    // FIX: Corrected typo from LOGS_key to LOGS_KEY.
    return getFromStorage<Record<string, MedicationLog[]>>(LOGS_KEY) || {};
  },

  async getAllUniquePrescribedMedicines(): Promise<Medication[]> {
    const prescriptions = getFromStorage<Record<string, Prescription>>(PRESCRIPTIONS_KEY) || {};
    const allMedications = Object.values(prescriptions).flatMap(p => p.medications);

    const uniqueMedicinesMap = new Map<string, Medication>();
    allMedications.forEach(med => {
        // A unique medication is defined by its name, dosage, and specific timing
        const key = `${med.name}|${med.dosage}|${med.dosageUnit}|${med.timing}`;
        if (!uniqueMedicinesMap.has(key)) {
            uniqueMedicinesMap.set(key, med);
        }
    });

    return Array.from(uniqueMedicinesMap.values());
  },
  
  async getUserById(userId: string): Promise<User | null> {
    const users = getFromStorage<Record<string, User>>(USERS_KEY) || {};
    return users[userId] || null;
  },

  async resetMpin(userId: string, newMpin: string): Promise<User | null> {
    const users = getFromStorage<Record<string, User>>(USERS_KEY) || {};
    const user = users[userId];
    if (user) {
        user.mpin = newMpin;
        users[userId] = user;
        saveToStorage(USERS_KEY, users);
        return user;
    }
    return null;
  },

  // Appointment Methods
  async getAppointmentsForPatient(patientId: string): Promise<Appointment[]> {
    const allAppointments = getFromStorage<Appointment[]>(APPOINTMENTS_KEY) || [];
    return allAppointments.filter(appt => appt.patientId === patientId);
  },

  async getAppointmentsForAdmin(hospitalCode: string): Promise<Appointment[]> {
    const allAppointments = getFromStorage<Appointment[]>(APPOINTMENTS_KEY) || [];
    return allAppointments.filter(appt => appt.hospitalCode === hospitalCode);
  },

  async createAppointment(appointmentData: Omit<Appointment, 'id' | 'patientName' | 'adminId' | 'hospitalCode' | 'status'> & { patient: User }): Promise<Appointment> {
    const allAppointments = getFromStorage<Appointment[]>(APPOINTMENTS_KEY) || [];
    const users = getFromStorage<Record<string, User>>(USERS_KEY) || {};
    
    const admin = Object.values(users).find(u => u.role === 'admin' && u.hospitalCode === appointmentData.patient.hospitalCode);
    
    if (!admin) {
        throw new Error("Could not find an admin for the patient's hospital code.");
    }

    const newAppointment: Appointment = {
      id: `appt_${Date.now()}_${Math.random()}`,
      ...appointmentData,
      patientName: `${appointmentData.patient.firstName} ${appointmentData.patient.lastName}`,
      adminId: admin.id,
      hospitalCode: admin.hospitalCode!,
      status: 'scheduled'
    };
    allAppointments.push(newAppointment);
    saveToStorage(APPOINTMENTS_KEY, allAppointments);
    return newAppointment;
  },

  async updateAppointmentStatus(appointmentId: string, status: Appointment['status']): Promise<Appointment | null> {
    const allAppointments = getFromStorage<Appointment[]>(APPOINTMENTS_KEY) || [];
    const appointmentIndex = allAppointments.findIndex(appt => appt.id === appointmentId);

    if (appointmentIndex !== -1) {
      allAppointments[appointmentIndex].status = status;
      saveToStorage(APPOINTMENTS_KEY, allAppointments);
      return allAppointments[appointmentIndex];
    }
    return null;
  },

  async updateAppointment(appointmentId: string, data: UpdateAppointmentData): Promise<Appointment | null> {
    const allAppointments = getFromStorage<Appointment[]>(APPOINTMENTS_KEY) || [];
    const appointmentIndex = allAppointments.findIndex(appt => appt.id === appointmentId);

    if (appointmentIndex !== -1) {
      allAppointments[appointmentIndex] = {
        ...allAppointments[appointmentIndex],
        ...data,
      };
      saveToStorage(APPOINTMENTS_KEY, allAppointments);
      return allAppointments[appointmentIndex];
    }
    return null;
  },

  async getAllUsers(): Promise<User[]> {
      const users = getFromStorage<Record<string, User>>(USERS_KEY) || {};
      return Object.values(users);
  },
};