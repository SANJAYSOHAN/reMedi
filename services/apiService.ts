

import type { User, Prescription, MedicationLog, Medication, Appointment, UpdateAppointmentData } from '../types';
import type { ApiService } from './api';
import { API_BASE_URL } from '../config';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown API error occurred' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    // Handle cases with no content
    if (response.status === 204) {
        return null;
    }
    return response.json();
};

const get = (endpoint: string) => fetch(`${API_BASE_URL}${endpoint}`).then(handleResponse);
const post = (endpoint: string, body: any) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
}).then(handleResponse);
const put = (endpoint: string, body: any) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
}).then(handleResponse);

export const realApiService: ApiService = {
  async register(user: User): Promise<{ user: User | null; error?: string }> {
    try {
      const registeredUser = await post('/register', user);
      return { user: registeredUser };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  },

  async login(id: string, mpin: string): Promise<User | null> {
    try {
      return await post('/login', { id, mpin });
    } catch (error) {
      console.error('Login failed:', error);
      return null;
    }
  },

  async updateUser(oldId: string, updatedUser: User): Promise<User | null> {
    try {
      return await put(`/users/${oldId}`, updatedUser);
    } catch (error) {
      console.error('Update user failed:', error);
      return null; // As per original mock logic on ID conflict
    }
  },

  async getPrescription(userId: string): Promise<Prescription | null> {
    return get(`/prescriptions/${userId}`);
  },

  async savePrescription(prescription: Prescription): Promise<Prescription> {
    return put(`/prescriptions/${prescription.userId}`, prescription);
  },

  async logMedication(userId: string, log: MedicationLog): Promise<MedicationLog> {
    return post(`/logs/${userId}`, log);
  },

  async getMedicationLogs(userId: string): Promise<MedicationLog[]> {
    return get(`/logs/${userId}`);
  },

  async getPatientsByHospitalCode(hospitalCode: string): Promise<User[]> {
    return get(`/patients?hospitalCode=${hospitalCode}`);
  },

  async getAdminByHospitalCode(hospitalCode: string): Promise<{ hospitalName: string; adminName: string } | null> {
    return get(`/admins?hospitalCode=${hospitalCode}`);
  },

  async getAllLogs(): Promise<Record<string, MedicationLog[]>> {
    return get('/logs');
  },

  async getAllUniquePrescribedMedicines(): Promise<Medication[]> {
    return get('/medicines/unique');
  },

  async getUserById(userId: string): Promise<User | null> {
    return get(`/users/${userId}`);
  },

  async resetMpin(userId: string, newMpin: string): Promise<User | null> {
    return post(`/users/${userId}/reset-mpin`, { newMpin });
  },

  getAllUsers(): Promise<User[]> {
    return get('/users');
  },

  // Appointments
  getAppointmentsForPatient(patientId: string): Promise<Appointment[]> {
    return get(`/appointments/patient/${patientId}`);
  },
  
  getAppointmentsForAdmin(hospitalCode: string): Promise<Appointment[]> {
     return get(`/appointments/admin/${hospitalCode}`);
  },
  
  createAppointment(appointmentData: Omit<Appointment, 'id' | 'patientName' | 'adminId' | 'hospitalCode' | 'status'> & { patient: User; }): Promise<Appointment> {
     return post('/appointments', appointmentData);
  },
  
  updateAppointmentStatus(appointmentId: string, status: "scheduled" | "completed" | "cancelled"): Promise<Appointment | null> {
     return put(`/appointments/${appointmentId}/status`, { status });
  },

  updateAppointment(appointmentId: string, data: UpdateAppointmentData): Promise<Appointment | null> {
    return put(`/appointments/${appointmentId}`, data);
  }
};