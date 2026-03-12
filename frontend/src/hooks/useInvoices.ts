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
    mutationFn: (invoice: Pick<Invoice, "order_id" | "invoice_number" | "total_price">) =>
      apiClient.post<Invoice>("/api/invoices/", invoice),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}