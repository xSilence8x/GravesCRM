import { useGraves } from "@/hooks/useGraves";
import { Grave } from "@/types/api";

/**
 * Compatibility hook.
 *
 * Backend už nemá /api/orders, objednávka/zakázka je reprezentovaná hrobem.
 * Nový kód by měl ideálně používat přímo useGraves().
 */
export type GraveOrder = Grave;
export type MaintenanceOrder = GraveOrder;

export function useOrders() {
  return useGraves();
}

export function useCompletedOrders() {
  const query = useGraves();

  return {
    ...query,
    data: (query.data ?? []).filter((grave: any) => grave.status === "dokončeno"),
  };
}
