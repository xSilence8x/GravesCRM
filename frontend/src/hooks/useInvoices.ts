import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { Invoice } from "@/types/api";

export type { Invoice };

export function useInvoices() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const data = await apiClient.get<{ invoices: Invoice[] }>("/api/invoices/");
      return data.invoices;
    },
    enabled: !!user,
  });
}

export function useAddInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoice: Pick<Invoice, "grave_id" | "total_price">) =>
      apiClient.post<Invoice>("/api/invoices/", invoice),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: number) => {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Nepodařilo se stornovat fakturu.");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices" ]});
      queryClient.invalidateQueries({ queryKey: ["graves"] });
    },
  });
}