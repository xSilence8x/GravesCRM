import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";

export interface GoogleCalendarTeamMember {
  user_id: number;
  nickname: string;
  color: string;
  connected: boolean;
  last_synced_at: string | null;
}

export interface GoogleCalendarStatusResponse {
  connected: boolean;
  google_email: string | null;
  sync_status: string;
  last_synced_at: string | null;
  calendar_color: string;
  team: GoogleCalendarTeamMember[];
}

export interface GoogleCalendarEvent {
  id: string;
  user_id: number;
  user_nickname: string;
  user_color: string;
  is_owner: boolean;
  summary: string;
  is_all_day: boolean;
  starts_at: string | null;
  ends_at: string | null;
  start_date: string | null;
  end_date: string | null;
}

export function useGoogleCalendarStatus() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["google-calendar", "status"],
    queryFn: async () => apiClient.get<GoogleCalendarStatusResponse>("/api/google-calendar/status"),
    enabled: !!user,
  });
}

export function useGoogleCalendarEvents(start: string, end: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["google-calendar", "events", start, end],
    queryFn: async () => {
      const data = await apiClient.get<{ events: GoogleCalendarEvent[] }>(`/api/google-calendar/events?start=${start}&end=${end}`);
      return data.events;
    },
    enabled: !!user,
  });
}

export function useGoogleCalendarSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ message: string }>("/api/google-calendar/sync", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["google-calendar", "status"] });
      qc.invalidateQueries({ queryKey: ["google-calendar", "events"] });
    },
  });
}

export function useGoogleCalendarDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete<{ message: string }>("/api/google-calendar/disconnect"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["google-calendar", "status"] });
      qc.invalidateQueries({ queryKey: ["google-calendar", "events"] });
    },
  });
}
