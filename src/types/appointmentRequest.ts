export interface AppointmentRequest {
  id: string;
  patientId: string;
  patientName: string;
  requestData: Record<string, unknown>;
  createdAt: string;
}