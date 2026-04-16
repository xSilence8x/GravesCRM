import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { Reminder, ReminderStatus } from "@/types/api";

export type { Reminder };

export function useReminders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const data = await apiClient.get<{ reminders: Reminder[] }>("/api/reminders/");
      return data.reminders;
    },
    enabled: !!user,
  });
}

export function useAddReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reminder: Pick<Reminder, "client_id" | "grave_id" | "next_date" | "status">) =>
      apiClient.post<Reminder>("/api/reminders/", reminder),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

export function useBulkAddReminders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reminders: Array<Pick<Reminder, "client_id" | "grave_id" | "next_date" | "status">>) =>
      apiClient.post<{ message: string; reminders: Reminder[] }>("/api/reminders/bulk-create", { reminders }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: number; next_date?: string; status?: ReminderStatus }) =>
      apiClient.patch<Reminder>(`/api/reminders/${id}`, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}