
export interface User {
  id: string;
  mpin: string;
  role: 'patient' | 'admin' | 'super-admin';
  hospitalCode?: string;
  hospitalName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  age?: number;
  profilePicture?: string; // Base64 encoded image
  gender?: 'male' | 'female' | 'other';
  mealTimings: MealTimings;
}

export interface MealTimings {
  breakfast: string; // "HH:MM"
  lunch: string; // "HH:MM"
  dinner: string; // "HH:MM"
}

export enum MedicationTiming {
  BeforeBreakfast = 'before-breakfast',
  AfterBreakfast = 'after-breakfast',
  BeforeLunch = 'before-lunch',
  AfterLunch = 'after-lunch',
  BeforeDinner = 'before-dinner',
  AfterDinner = 'after-dinner',
  EmptyStomachBreakfast = 'empty-stomach-breakfast',
  EmptyStomachLunch = 'empty-stomach-lunch',
  EmptyStomachDinner = 'empty-stomach-dinner',
  Bedtime = 'bedtime',
}

export enum DosageUnit {
    TABLET = 'tablet',
    ML = 'ml',
    TABLE_SPOON = 'tbsp',
    TEA_SPOON = 'tsp',
    NIL = 'nil',
}

export interface Medication {
  name: string;
  dosage: string;
  dosageUnit: DosageUnit;
  timing: MedicationTiming;
  startDate: string; // YYYY-MM-DD
  durationInDays: number;
  instructions?: string;
}

export interface Prescription {
  userId: string;
  medications: Medication[];
  dietPlan?: string;
}

export interface MedicationLog {
  date: string; // YYYY-MM-DD
  medicationName: string;
  timing: MedicationTiming;
  status: 'taken' | 'missed';
}

export interface DailyAdherence {
  date: Date;
  taken: Medication[];
  missed: Medication[];
  scheduled: Medication[];
  isFuture: boolean;
}

export interface NotificationPayload {
    medication: Medication;
    meal: string;
    time: string; // e.g., "Before Breakfast"
    mealTime: string; // e.g., "08:30"
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  adminId: string;
  hospitalCode: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface UpdateAppointmentData {
  date: string;
  time: string;
  reason: string;
}
