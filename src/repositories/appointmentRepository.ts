import { AppointmentRequest } from '../types/appointmentRequest';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `API request failed: ${response.status} ${path}`);
  }
  return response.json() as Promise<T>;
}

export const appointmentRepository = {
  getAll(): Promise<AppointmentRequest[]> {
    return request<AppointmentRequest[]>('/appointment-requests');
  },

  create(patientId: string, requestData: Record<string, unknown>): Promise<AppointmentRequest> {
    return request<AppointmentRequest>('/appointment-requests', {
      method: 'POST',
      body: JSON.stringify({ patientId, requestData }),
    });
  },
};