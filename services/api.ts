

import type { User, Prescription, MedicationLog, Medication, Appointment, UpdateAppointmentData } from '../types';
import { USE_MOCK_API } from '../config';
import { mockApiService } from './mockApiService';
import { realApiService } from './apiService';

export interface ApiService {
    register(user: User): Promise<{ user: User | null; error?: string }>;
    login(id: string, mpin: string): Promise<User | null>;
    updateUser(oldId: string, updatedUser: User): Promise<User | null>;
    getPrescription(userId: string): Promise<Prescription | null>;
    savePrescription(prescription: Prescription): Promise<Prescription>;
    logMedication(userId: string, log: MedicationLog): Promise<MedicationLog>;
    getMedicationLogs(userId: string): Promise<MedicationLog[]>;
    getPatientsByHospitalCode(hospitalCode: string): Promise<User[]>;
    getAdminByHospitalCode(hospitalCode: string): Promise<{ hospitalName: string; adminName: string } | null>;
    getAllLogs(): Promise<Record<string, MedicationLog[]>>;
    getAllUniquePrescribedMedicines(): Promise<Medication[]>;
    getUserById(userId: string): Promise<User | null>;
    resetMpin(userId: string, newMpin: string): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
    
    // Appointments
    getAppointmentsForPatient(patientId: string): Promise<Appointment[]>;
    getAppointmentsForAdmin(hospitalCode: string): Promise<Appointment[]>;
    createAppointment(appointmentData: Omit<Appointment, 'id' | 'patientName' | 'adminId' | 'hospitalCode' | 'status'> & { patient: User }): Promise<Appointment>;
    updateAppointmentStatus(appointmentId: string, status: Appointment['status']): Promise<Appointment | null>;
    updateAppointment(appointmentId: string, data: UpdateAppointmentData): Promise<Appointment | null>;
}

export const apiService: ApiService = USE_MOCK_API ? mockApiService : realApiService;