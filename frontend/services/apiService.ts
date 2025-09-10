
import type { User, Prescription, MedicationLog, Medication, Appointment, UpdateAppointmentData } from '../types';
import type { ApiService } from './api';
import { API_BASE_URL } from '../config';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        // Try to parse error from backend, otherwise provide a generic one
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        // Django REST Framework often puts errors in a detail key or field keys
        const errorMessage = errorData.detail || errorData.error || JSON.stringify(errorData);
        throw new Error(errorMessage);
    }
    // Handle cases with no content like 204
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
      // The API uses the new ID in the body and old ID in the URL
      return await put(`/users/${oldId}`, updatedUser);
    } catch (error: any) {
        // Handle 409 conflict for duplicate ID
        if (error.message.includes('409')) {
             console.error('Update user failed: New ID is already taken.');
        } else {
             console.error('Update user failed:', error);
        }
        return null; 
    }
  },

  async getPrescription(userId: string): Promise<Prescription | null> {
    return get(`/prescriptions/${userId}`).catch(err => {
        // If 404, it means no prescription exists, which is not an error
        if (err.message.includes('404')) return null;
        throw err;
    });
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
     return get(`/admins?hospitalCode=${hospitalCode}`).catch(err => {
        if (err.message.includes('404')) return null;
        throw err;
    });
  },

  async getAllLogs(): Promise<Record<string, MedicationLog[]>> {
    return get('/logs');
  },

  async getAllUniquePrescribedMedicines(): Promise<Medication[]> {
    // This endpoint would need to be created in Django if needed.
    // For now, returning empty array to satisfy the interface.
    console.warn("getAllUniquePrescribedMedicines is not implemented in the real API yet.");
    return Promise.resolve([]);
  },

  async getUserById(userId: string): Promise<User | null> {
     return get(`/users/${userId}`).catch(err => {
        if (err.message.includes('404')) return null;
        throw err;
    });
  },

  async resetMpin(userId: string, newMpin: string): Promise<User | null> {
    return post(`/users/${userId}/reset-mpin`, { newMpin });
  },

  getAllUsers(): Promise<User[]> {
    return get('/users/all');
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
