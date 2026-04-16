import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { Grave, AdditionalService, Photo } from "@/types/api";

export type { Grave };

type GraveUpsertPayload = {
  client_id: number;
  graveyard_id: number;
  name_on_grave?: string | null;
  grave_number: string;
  latitude: number;
  longitude: number;
  cleaning_frequency: Grave["cleaning_frequency"];
  base_price: number;
  notes: string;
  custom_frequency_months?: number | null;
  status?: Grave["status"];
  completion_date?: string | null;
};

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
    mutationFn: (grave: GraveUpsertPayload) =>
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

export function useAddService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ graveId, ...service }: Omit<AdditionalService, "id" | "grave_id"> & { graveId: number }) =>
      apiClient.post<AdditionalService>(`/api/graves/${graveId}/services`, service),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["graves"] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: number) =>
      apiClient.delete(`/api/graves/services/${serviceId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["graves"] }),
  });
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      graveId,
      file,
      photo_type,
      note,
    }: {
      graveId: number;
      file: File;
      photo_type: "před" | "po";
      note?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("photo_type", photo_type);
      if (note) formData.append("note", note);

      const res = await fetch(`/api/graves/${graveId}/photos`, {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["graves"] }),
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: number) =>
      apiClient.delete(`/api/graves/photos/${photoId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["graves"] }),
  });
}