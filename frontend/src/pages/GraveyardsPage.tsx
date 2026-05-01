import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useAddGraveyard, useGraveyards, useUpdateGraveyard } from "@/hooks/useGraveyards";
import { Pencil, Plus, Search } from "lucide-react";

export default function GraveyardsPage() {
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addLatitude, setAddLatitude] = useState("");
  const [addLongitude, setAddLongitude] = useState("");
  const [editItem, setEditItem] = useState<{ id: number; name: string; latitude: string; longitude: string } | null>(null);

  const { data: graveyards = [], isLoading } = useGraveyards();
  const addGraveyard = useAddGraveyard();
  const updateGraveyard = useUpdateGraveyard();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return graveyards;
    return graveyards.filter((g) => g.name.toLowerCase().includes(query));
  }, [graveyards, search]);

  const handleAdd = () => {
    const name = addName.trim();
    const latitude = addLatitude.trim();
    const longitude = addLongitude.trim();
    if (!name) {
      toast({ title: "Chyba", description: "Název hřbitova je povinný.", variant: "destructive" });
      return;
    }

    const parsedLatitude = latitude === "" ? null : Number(latitude);
    const parsedLongitude = longitude === "" ? null : Number(longitude);
    if ((latitude !== "" && Number.isNaN(parsedLatitude)) || (longitude !== "" && Number.isNaN(parsedLongitude))) {
      toast({ title: "Chyba", description: "Souřadnice musí být číslo.", variant: "destructive" });
      return;
    }

    addGraveyard.mutate(
      { name, latitude: parsedLatitude, longitude: parsedLongitude },
      {
        onSuccess: () => {
          toast({ title: "Hřbitov přidán" });
          setAddName("");
          setAddLatitude("");
          setAddLongitude("");
          setOpenAdd(false);
        },
        onError: (e) => toast({ title: "Chyba", description: e.message, variant: "destructive" }),
      },
    );
  };

  const handleEditSave = () => {
    if (!editItem) return;
    const name = editItem.name.trim();
    const latitude = editItem.latitude.trim();
    const longitude = editItem.longitude.trim();
    if (!name) {
      toast({ title: "Chyba", description: "Název hřbitova je povinný.", variant: "destructive" });
      return;
    }

    const parsedLatitude = latitude === "" ? null : Number(latitude);
    const parsedLongitude = longitude === "" ? null : Number(longitude);
    if ((latitude !== "" && Number.isNaN(parsedLatitude)) || (longitude !== "" && Number.isNaN(parsedLongitude))) {
      toast({ title: "Chyba", description: "Souřadnice musí být číslo.", variant: "destructive" });
      return;
    }

    updateGraveyard.mutate(
      { id: editItem.id, name, latitude: parsedLatitude, longitude: parsedLongitude },
      {
        onSuccess: () => {
          toast({ title: "Hřbitov upraven" });
          setEditItem(null);
        },
        onError: (e) => toast({ title: "Chyba", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Hřbitovy</h1>
            <p className="page-description">Seznam a správa hřbitovů</p>
          </div>

          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Přidat hřbitov
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Přidat hřbitov</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="graveyard-name">Název</Label>
                  <Input
                    id="graveyard-name"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Např. Ústřední hřbitov"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="graveyard-latitude">Zeměpisná šířka</Label>
                    <Input
                      id="graveyard-latitude"
                      value={addLatitude}
                      onChange={(e) => setAddLatitude(e.target.value)}
                      placeholder="49.1697889"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="graveyard-longitude">Zeměpisná délka</Label>
                    <Input
                      id="graveyard-longitude"
                      value={addLongitude}
                      onChange={(e) => setAddLongitude(e.target.value)}
                      placeholder="16.5938528"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpenAdd(false)}>
                    Zrušit
                  </Button>
                  <Button onClick={handleAdd} disabled={addGraveyard.isPending}>
                    Uložit
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Hledat hřbitov..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="w-full max-w-full md:max-w-[75%]">
        <CardHeader>
          <CardTitle>Seznam hřbitovů</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">
              {graveyards.length === 0 ? "Zatím nejsou evidované žádné hřbitovy." : "Žádný hřbitov neodpovídá hledání."}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((graveyard) => (
                <div
                  key={graveyard.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{graveyard.name}</p>
                    {(graveyard.latitude !== null && graveyard.longitude !== null) && (
                      <p className="text-xs text-muted-foreground">{graveyard.latitude}, {graveyard.longitude}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditItem({
                      id: graveyard.id,
                      name: graveyard.name,
                      latitude: graveyard.latitude !== null ? String(graveyard.latitude) : "",
                      longitude: graveyard.longitude !== null ? String(graveyard.longitude) : "",
                    })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upravit hřbitov</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-graveyard-name">Název</Label>
              <Input
                id="edit-graveyard-name"
                value={editItem?.name ?? ""}
                onChange={(e) => setEditItem((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-graveyard-latitude">Zeměpisná šířka</Label>
                <Input
                  id="edit-graveyard-latitude"
                  value={editItem?.latitude ?? ""}
                  onChange={(e) => setEditItem((prev) => (prev ? { ...prev, latitude: e.target.value } : null))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-graveyard-longitude">Zeměpisná délka</Label>
                <Input
                  id="edit-graveyard-longitude"
                  value={editItem?.longitude ?? ""}
                  onChange={(e) => setEditItem((prev) => (prev ? { ...prev, longitude: e.target.value } : null))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditItem(null)}>
                Zrušit
              </Button>
              <Button onClick={handleEditSave} disabled={updateGraveyard.isPending}>
                Uložit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
