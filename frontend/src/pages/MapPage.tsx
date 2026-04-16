import { useState, lazy, Suspense, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGraves } from "@/hooks/useGraves";
import { useClients } from "@/hooks/useClients";
import { useGraveyards } from "@/hooks/useGraveyards";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebar } from "@/components/ui/sidebar";

const LazyMap = lazy(() => import("@/components/GraveMap"));
const CENTRAL_BRNO_COORDS: [number, number] = [49.1697889, 16.5938528];

export default function MapPage() {
  const [cemeteryFilter, setCemeteryFilter] = useState("all");
  const [selectOpen, setSelectOpen] = useState(false);
  const { isMobile, openMobile } = useSidebar();
  const { data: graves = [], isLoading } = useGraves();
  const { data: clients = [] } = useClients();
  const { data: graveyards = [] } = useGraveyards();

  // Zavřít Select dropdown když se sidebar otevře na mobile
  useEffect(() => {
    if (isMobile && openMobile) {
      setSelectOpen(false);
    }
  }, [isMobile, openMobile]);

  const cemeteries = [...new Set([...graveyards.map((g) => g.name), ...graves.map((g: any) => g.cemetery_name)])];
  const filtered = graves.filter((g: any) => cemeteryFilter === "all" || g.cemetery_name === cemeteryFilter);
  const getClientName = (id: number) => clients.find((c) => c.id === id)?.full_name ?? "—";

  const selectedGraveyard = cemeteryFilter === "all" ? null : graveyards.find((g) => g.name === cemeteryFilter);
  const centralBrnoGraveyard = graveyards.find(
    (g) => g.name === "Ústřední hřbitov Brno" || g.name === "Ústřední hřbitov",
  );

  const graveData = filtered.map((g: any) => ({
    id: g.id, clientId: g.client_id, cemeteryName: g.cemetery_name, graveNumber: g.grave_number,
    latitude: g.latitude, longitude: g.longitude, basePrice: Number(g.base_price),
  }));

  const center: [number, number] =
    selectedGraveyard && selectedGraveyard.latitude !== null && selectedGraveyard.longitude !== null
      ? [selectedGraveyard.latitude, selectedGraveyard.longitude]
      : centralBrnoGraveyard && centralBrnoGraveyard.latitude !== null && centralBrnoGraveyard.longitude !== null
        ? [centralBrnoGraveyard.latitude, centralBrnoGraveyard.longitude]
      : graveData.length > 0
        ? [
            graveData.reduce((sum, grave) => sum + grave.latitude, 0) / graveData.length,
            graveData.reduce((sum, grave) => sum + grave.longitude, 0) / graveData.length,
          ]
        : CENTRAL_BRNO_COORDS;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Mapa hrobů</h1>
        <p className="page-description">Zobrazení všech hrobů na interaktivní mapě</p>
      </div>

      <div className="relative" style={{ zIndex: 50 }}>
        <Select value={cemeteryFilter} onValueChange={setCemeteryFilter} open={selectOpen} onOpenChange={setSelectOpen}>
          <SelectTrigger className="w-full sm:w-[250px]"><SelectValue placeholder="Všechny hřbitovy" /></SelectTrigger>
          <SelectContent position="popper" className="z-50">
            <SelectItem value="all">Všechny hřbitovy</SelectItem>
            {cemeteries.map((c) => <SelectItem key={String(c)} value={String(c)}>{String(c)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border overflow-hidden relative" style={{ height: "calc(100vh - 280px)", minHeight: 400, zIndex: 0 }}>
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Načítám mapu…</div>}>
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
