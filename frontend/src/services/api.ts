const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('sigo_token');

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<{ user: any }>('/auth/me'),
  getDentists: () => request<{ dentists: any[] }>('/auth/dentists'),

  // Patients
  getPatients: (search?: string) =>
    request<{ patients: any[] }>(search ? `/patients?search=${encodeURIComponent(search)}` : '/patients'),
  getPatientById: (id: string) => request<{ patient: any }>(`/patients/${id}`),
  createPatient: (data: any) =>
    request<{ message: string; patient: any }>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePatient: (id: string, data: any) =>
    request<{ message: string; patient: any }>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  addMedicalAlert: (patientId: string, alertData: any) =>
    request<{ message: string; alert: any }>(`/patients/${patientId}/alerts`, {
      method: 'POST',
      body: JSON.stringify(alertData),
    }),

  // Chairs
  getChairs: () => request<{ chairs: any[] }>('/chairs'),

  // Appointments
  getAppointments: (params?: { date?: string; dentistId?: string; dentalChairId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ appointments: any[] }>(query ? `/appointments?${query}` : '/appointments');
  },
  createAppointment: (data: any) =>
    request<{ message: string; appointment: any }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAppointmentStatus: (id: string, status: string, cancellationReason?: string) =>
    request<{ message: string; appointment: any }>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, cancellationReason }),
    }),

  // Odontogram
  getPatientOdontogram: (patientId: string) =>
    request<{ odontogram: any }>(`/odontogram/patient/${patientId}`),
  updateOdontogramSurface: (patientId: string, data: any) =>
    request<{ message: string; surfaceRecord?: any }>(`/odontogram/patient/${patientId}/surface`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateOdontogramTooth: (patientId: string, data: any) =>
    request<{ message: string; toothRecord?: any }>(`/odontogram/patient/${patientId}/tooth`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Periodontogram (RF-04)
  getPeriodontogram: (patientId: string) =>
    request<{ periodontogram: any[] }>(`/odontogram/periodontogram/patient/${patientId}`),
  savePeriodontalMeasurement: (data: any) =>
    request<{ message: string; entry: any }>('/odontogram/periodontogram', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Evolution & SOEP (RN-01)
  getPatientEvolutions: (patientId: string) =>
    request<{ notes: any[] }>(`/evolution/patient/${patientId}`),
  createEvolutionNote: (data: any) =>
    request<{ message: string; note: any }>('/evolution', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createAddendum: (noteId: string, content: string) =>
    request<{ message: string; addendum: any }>(`/evolution/${noteId}/addendum`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  // Informed Consents (RF-06)
  getPatientConsents: (patientId: string) =>
    request<{ consents: any[] }>(`/evolution/consents/patient/${patientId}`),
  createInformedConsent: (data: any) =>
    request<{ message: string; consent: any }>('/evolution/consents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Billing & Blind Cash Close (RN-02)
  getCurrentShift: () => request<{ shift: any }>('/billing/shifts/current'),
  openShift: (data: { initialCash: number; notes?: string }) =>
    request<{ message: string; shift: any }>('/billing/shifts/open', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  closeBlindShift: (data: { countedCash: number; notes?: string }) =>
    request<{ message: string; shift: any; summary: any }>('/billing/shifts/close', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createInvoice: (data: any) =>
    request<{ message: string; invoice: any }>('/billing/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getInvoices: () => request<{ invoices: any[] }>('/billing/invoices'),
  getCommissions: () => request<{ commissions: any[] }>('/billing/commissions'),

  // Inventory (RF-14)
  getInventory: () => request<{ inventory: any[] }>('/inventory'),
  registerStockMovement: (data: any) =>
    request<{ message: string; movement: any; item: any }>('/inventory/movement', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Audit Logs (RNF-06)
  getAuditLogs: (params?: { action?: string; entityName?: string; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ logs: any[] }>(query ? `/audit?${query}` : '/audit');
  },
};
