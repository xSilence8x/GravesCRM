import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { Graveyard } from "@/types/api";

export type { Graveyard };

export function useGraveyards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["graveyards"],
    queryFn: async () => {
      const data = await apiClient.get<{ graveyards: Graveyard[] }>("/api/graveyards/");
      return data.graveyards;
    },
    enabled: !!user,
  });
}

export function useAddGraveyard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; latitude?: number | null; longitude?: number | null }) => apiClient.post<Graveyard>("/api/graveyards/", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["graveyards"] }),
  });
}

export function useUpdateGraveyard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; name: string; latitude?: number | null; longitude?: number | null }) =>
      apiClient.patch<Graveyard>(`/api/graveyards/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["graveyards"] }),
  });
}
