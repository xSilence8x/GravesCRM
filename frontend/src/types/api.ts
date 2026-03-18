// Central type definitions matching the Flask/PostgreSQL backend models.
// These replace the auto-generated Supabase types.

export type CleaningFrequency = "1x" | "2x" | "4x" | "custom";
export type OrderStatus = "planned" | "in-progress" | "completed" | "cancelled";
export type PhotoType = "before" | "after";
export type ReminderStatus = "upcoming" | "due-soon" | "overdue";

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
  created_at: string;
}

export interface AdditionalService {
  id: number;
  order_id: number;
  name: string;
  price: number;
  note: string;
}

export interface Photo {
  id: number;
  order_id: number;
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
  status: OrderStatus;
  additional_services: AdditionalService[];
  photos: Photo[];
  created_at: string;
}

export interface Invoice {
  id: number;
  order_id: number;
  invoice_number: string;
  issue_date: string | null;
  due_date: string | null;
  total_price: number;
  notes: string;
  maintenance_orders: {
    id: number;
    total_price: number;
    clients: { full_name: string; billing_address: string; email: string; phone: string };
    graves: { cemetery_name: string; grave_number: string };
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
  created_at: string;
}