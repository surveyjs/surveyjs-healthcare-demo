export type FormId =
  | 'login'
  | 'patient-registration'
  | 'patient-search'
  | 'edit-patient'
  | 'add-new-visit'
  | 'add-new-prescription'
  | 'patient-visits'
  | 'prescribed-medication';

export interface FormMetadata {
  id: FormId;
  title: string;
  description: string;
  defaultSchema: object;
}
