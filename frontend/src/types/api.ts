// Central type definitions matching the Flask/PostgreSQL backend models.
// These replace the auto-generated Supabase types.

export type CleaningFrequency = "1x" | "2x" | "4x" | "vlastní";
export type GraveStatus = "plánováno" | "probíhá" | "dokončeno" | "zrušeno";
export type PhotoType = "před" | "po";
export type ReminderStatus = "nadcházející" | "brzy" | "po termínu" | "deaktivovaný";

export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
}

export interface Client {
  id: number;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  ico: string | null;
  email: string;
  phone: string;
  billing_address: string;
  notes: string;
  created_at: string;
}

export interface Graveyard {
  id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Grave {
  id: number;
  client_id: number;
  graveyard_id: number;
  clients: { full_name: string };
  cemetery_name: string;
  name_on_grave: string | null;
  grave_number: string;
  latitude: number;
  longitude: number;
  cleaning_frequency: CleaningFrequency;
  custom_frequency_months: number | null;
  base_price: number;
  notes: string;
  status: GraveStatus;
  completion_date: string | null;
  photos: Photo[];
  additional_services: AdditionalService[];
  reminders?: Array<{
    id: number;
    next_date: string;
    status: ReminderStatus;
  }>;
  created_at: string;
}

export interface AdditionalService {
  id: number;
  grave_id: number;
  name: string;
  price: number;
  note: string;
}

export interface Photo {
  id: number;
  grave_id: number;
  url: string;
  type: PhotoType;
  note: string;
}

export interface MaintenanceOrder {
  id: number;
  client_id: number;
  grave_id: number;
  clients: { full_name: string };
  graves: { cemetery_name: string; grave_number: string };
  planned_date: string | null;
  completion_date: string | null;
  total_price: number;
  notes: string;
  status: GraveStatus;
  additional_services: AdditionalService[];
  photos: Photo[];
  created_at: string;
}

export interface Invoice {
  id: number;
  grave_id: number;
  invoice_number: string;
  issue_date: string | null;
  due_date: string | null;
  total_price: number;
  notes: string;
  grave: {
    id: number;
    base_price: number;
    status: GraveStatus;
    clients: { full_name: string; billing_address: string; email: string; phone: string };
    graveyard: { name: string };
    grave_number: string;
    name_on_grave: string | null;
    additional_services: AdditionalService[];
  } | null;
  created_at: string;
}

export interface Reminder {
  id: number;
  client_id: number;
  grave_id: number;
  clients: { full_name: string };
  graves: { cemetery_name: string; name_on_grave: string | null; grave_number: string; base_price: number; cleaning_frequency: string };
  next_date: string | null;
  status: ReminderStatus;
  cleaning_sequence: number | null;
  cleaning_total: number | null;
  created_at: string;
}