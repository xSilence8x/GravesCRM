import { useState, lazy, Suspense } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGraves } from "@/hooks/useGraves";
import { useClients } from "@/hooks/useClients";
import { Skeleton } from "@/components/ui/skeleton";

const LazyMap = lazy(() => import("@/components/GraveMap"));

export default function MapPage() {
  const [cemeteryFilter, setCemeteryFilter] = useState("all");
  const { data: graves = [], isLoading } = useGraves();
  const { data: clients = [] } = useClients();

  const cemeteries = [...new Set(graves.map((g: any) => g.cemetery_name))];
  const filtered = graves.filter((g: any) => cemeteryFilter === "all" || g.cemetery_name === cemeteryFilter);
  const getClientName = (id: string) => clients.find((c) => c.id === id)?.full_name ?? "—";

  const graveData = filtered.map((g: any) => ({
    id: g.id, clientId: g.client_id, cemeteryName: g.cemetery_name, graveNumber: g.grave_number,
    latitude: g.latitude, longitude: g.longitude, basePrice: Number(g.base_price),
  }));

  const center: [number, number] = graveData.length > 0
    ? [graveData.reduce((s, g) => s + g.latitude, 0) / graveData.length, graveData.reduce((s, g) => s + g.longitude, 0) / graveData.length]
    : [50.0755, 14.4378];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Grave Map</h1>
        <p className="page-description">View all grave locations on an interactive map</p>
      </div>

      <div className="relative" style={{ zIndex: 1000 }}>
        <Select value={cemeteryFilter} onValueChange={setCemeteryFilter}>
          <SelectTrigger className="w-full sm:w-[250px]"><SelectValue placeholder="All cemeteries" /></SelectTrigger>
          <SelectContent position="popper" className="z-[1001]">
            <SelectItem value="all">All cemeteries</SelectItem>
            {cemeteries.map((c) => <SelectItem key={String(c)} value={String(c)}>{String(c)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border overflow-hidden relative" style={{ height: "calc(100vh - 280px)", minHeight: 400, zIndex: 0 }}>
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading map…</div>}>
            <LazyMap
              graves={graveData as any}
              center={center}
              zoom={graveData.length <= 2 ? 14 : 7}
              getClientName={getClientName}
              cemeteryFilter={cemeteryFilter}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
