export interface Client {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  billingAddress: string;
  notes: string;
  createdAt: string;
}

export type CleaningFrequency = "1x" | "2x" | "4x" | "custom";

export interface Grave {
  id: string;
  clientId: string;
  cemeteryName: string;
  graveNumber: string;
  latitude: number;
  longitude: number;
  cleaningFrequency: CleaningFrequency;
  customFrequencyMonths?: number;
  basePrice: number;
  notes: string;
}

export interface AdditionalService {
  id: string;
  orderId: string;
  name: string;
  price: number;
  note: string;
}

export type OrderStatus = "planned" | "in-progress" | "completed" | "cancelled";

export interface MaintenanceOrder {
  id: string;
  clientId: string;
  graveId: string;
  plannedDate: string;
  completionDate: string | null;
  services: AdditionalService[];
  totalPrice: number;
  notes: string;
  status: OrderStatus;
}

export interface Photo {
  id: string;
  orderId: string;
  url: string;
  type: "before" | "after";
  uploadDate: string;
  note: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalPrice: number;
  notes: string;
}

export type ReminderStatus = "upcoming" | "due-soon" | "overdue";

export interface Reminder {
  id: string;
  graveId: string;
  clientId: string;
  nextDate: string;
  status: ReminderStatus;
}
