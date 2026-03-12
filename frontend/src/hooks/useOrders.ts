import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { MaintenanceOrder, AdditionalService } from "@/types/api";

export type { MaintenanceOrder };

export function useOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const data = await apiClient.get<{ orders: MaintenanceOrder[] }>("/api/orders/");
      return data.orders;
    },
    enabled: !!user,
  });
}

export function useAddOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: Pick<MaintenanceOrder, "client_id" | "grave_id" | "planned_date" | "notes">) =>
      apiClient.post<MaintenanceOrder>("/api/orders/", order),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<MaintenanceOrder> & { id: number }) =>
      apiClient.patch<MaintenanceOrder>(`/api/orders/${id}`, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/orders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useAddService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, ...service }: Omit<AdditionalService, "id"> & { orderId: number }) =>
      apiClient.post<AdditionalService>(`/api/orders/${orderId}/services`, service),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      file,
      type,
      note,
    }: {
      orderId: number;
      file: File;
      type: "before" | "after";
      note?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      if (note) formData.append("note", note);

      const res = await fetch(`/api/orders/${orderId}/photos`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Upload failed: ${text}`);
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}