import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { Client } from "@/types/api";

export type { Client };

export function useClients() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const data = await apiClient.get<{ clients: Client[] }>("/api/clients/");
      return data.clients;
    },
    enabled: !!user,
  });
}

export function useAddClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (client: Omit<Client, "id" | "created_at" | "first_name" | "last_name" | "company">) =>
      apiClient.post<Client>("/api/clients/", client),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<Client> & { id: number }) =>
      apiClient.patch<Client>(`/api/clients/${id}`, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/clients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}