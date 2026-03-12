import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { Grave } from "@/types/api";

export type { Grave };

export function useGraves() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["graves"],
    queryFn: async () => {
      const data = await apiClient.get<{ graves: Grave[] }>("/api/graves/");
      return data.graves;
    },
    enabled: !!user,
  });
}

export function useAddGrave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (grave: Omit<Grave, "id" | "created_at" | "clients">) =>
      apiClient.post<Grave>("/api/graves/", grave),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["graves"] }),
  });
}

export function useUpdateGrave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<Grave> & { id: number }) =>
      apiClient.patch<Grave>(`/api/graves/${id}`, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["graves"] }),
  });
}

export function useDeleteGrave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/graves/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["graves"] }),
  });
}