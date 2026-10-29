export type Role = 'ADMIN' | 'RECEPTIONIST' | 'DENTIST' | 'ASSISTANT' | 'AUDITOR';

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'INSURANCE';

export type AppointmentStatus =
  | 'PROGRAMADO'
  | 'CONFIRMADO'
  | 'EN_SALA'
  | 'EN_ATENCION'
  | 'ATENDIDO'
  | 'CANCELADO'
  | 'NO_ASISTIO';

export type AlertSeverity = 'CRITICAL' | 'MODERATE' | 'MILD';

export type SurfaceCondition =
  | 'CARIES'
  | 'RESTAURACION_RESINA'
  | 'RESTAURACION_AMALGAMA'
  | 'SELLANTE'
  | 'FRACTURA'
  | 'INCRUSTACION';

export type ToothGeneralCondition =
  | 'SANO'
  | 'AUSENTE'
  | 'CORONA'
  | 'ENDODONCIA'
  | 'IMPLANTE'
  | 'PROTESIS_FIJA'
  | 'PROTESIS_REMOVIBLE'
  | 'DIENTE_ERUPCION'
  | 'EXTRACCION_INDICADA';

export type ToothSurface = 'MESIAL' | 'DISTAL' | 'OCLUSAL' | 'VESTIBULAR' | 'LINGUAL';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  specialty?: string | null;
  licenseNumber?: string | null;
  phone?: string | null;
}

export interface MedicalAlert {
  id: string;
  conditionName: string;
  severity: AlertSeverity;
  requiresPremedication: boolean;
  notes?: string | null;
}

export interface Patient {
  id: string;
  documentType: string;
  identification: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  city?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  legalGuardianName?: string | null;
  legalGuardianPhone?: string | null;
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
  bloodType?: string | null;
  notes?: string | null;
  medicalAlerts?: MedicalAlert[];
  appointments?: Appointment[];
  odontograms?: Odontogram[];
  treatmentPlans?: TreatmentPlan[];
  evolutionNotes?: EvolutionNote[];
}

export interface DentalChair {
  id: string;
  name: string;
  roomNumber: string;
  description?: string | null;
}

export interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  dentalChairId: string;
  startDateTime: string;
  endDateTime: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string | null;
  cancellationReason?: string | null;
  patient?: Patient;
  dentist?: User;
  dentalChair?: DentalChair;
}

export interface ToothSurfaceRecord {
  id: string;
  surface: ToothSurface;
  condition: SurfaceCondition;
  colorCode: string;
  notes?: string | null;
}

export interface ToothRecord {
  id: string;
  toothNumber: number;
  generalCondition: ToothGeneralCondition;
  notes?: string | null;
  surfaces: ToothSurfaceRecord[];
}

export interface Odontogram {
  id: string;
  patientId: string;
  dentistId: string;
  notationType: 'FDI' | 'UNIVERSAL';
  dentitionType: 'PERMANENT' | 'TEMPORARY';
  notes?: string | null;
  dentist?: User;
  teeth: ToothRecord[];
  createdAt: string;
}

export interface EvolutionAddendum {
  id: string;
  content: string;
  digitalSignature?: string | null;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    licenseNumber?: string | null;
  };
}

export interface EvolutionNote {
  id: string;
  subjective: string;
  objective: string;
  evaluation: string;
  plan: string;
  digitalSignature?: string | null;
  isLocked: boolean;
  createdAt: string;
  dentist: {
    id: string;
    firstName: string;
    lastName: string;
    licenseNumber?: string | null;
  };
  addendums: EvolutionAddendum[];
}

export interface TreatmentItem {
  id: string;
  toothNumber?: number | null;
  procedureCode?: string | null;
  procedureName: string;
  category: string;
  unitCost: number;
  quantity: number;
  discount: number;
  totalCost: number;
  isApproved: boolean;
  isCompleted: boolean;
}

export interface TreatmentPlanPhase {
  id: string;
  phaseNumber: number;
  name: string;
  isCompleted: boolean;
  items: TreatmentItem[];
}

export interface TreatmentPlan {
  id: string;
  title: string;
  status: 'DRAFT' | 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';
  totalCost: number;
  discountRate: number;
  finalAmount: number;
  notes?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  dentist?: User;
  phases: TreatmentPlanPhase[];
}

export interface CashShift {
  id: string;
  cashierId: string;
  openedAt: string;
  closedAt?: string | null;
  initialCash: number;
  countedCash?: number | null;
  systemCalculatedCash?: number | null;
  difference?: number | null;
  status: 'OPEN' | 'CLOSED';
  notes?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  notes?: string | null;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    identification: string;
  };
  payments: Array<{
    id: string;
    paymentMethod: string;
    amount: number;
    referenceCode?: string | null;
  }>;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  stockQuantity: number;
  minStockThreshold: number;
  costPerUnit: number;
  isLowStock?: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  entityName: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: any;
  timestamp: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
  };
}
