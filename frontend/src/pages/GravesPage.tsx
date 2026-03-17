import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Trash2, Pencil } from "lucide-react";
import { useGraves, useAddGrave, useUpdateGrave, useDeleteGrave } from "@/hooks/useGraves";
import { useClients } from "@/hooks/useClients";
import { useGraveyards } from "@/hooks/useGraveyards";
import { EditGraveDialog } from "@/components/EditGraveDialog";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function GravesPage() {
  const [search, setSearch] = useState("");
  const [cemeteryFilter, setCemeteryFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editGrave, setEditGrave] = useState<any | null>(null);
  const { data: graves = [], isLoading } = useGraves();
  const { data: clients = [] } = useClients();
  const { data: graveyards = [] } = useGraveyards();
  const addGrave = useAddGrave();
  const updateGrave = useUpdateGrave();
  const deleteGrave = useDeleteGrave();

  const [form, setForm] = useState({
    client_id: "", graveyard_id: "", grave_number: "", latitude: "50.0755", longitude: "14.4378",
    cleaning_frequency: "2x" as "1x" | "2x" | "4x" | "custom", base_price: "", notes: "",
  });

  const cemeteries = [...new Set(graves.map((g: any) => g.cemetery_name))];
  const getClientName = (g: any) => g.clients?.full_name ?? "—";

  const filtered = graves.filter((g: any) => {
    const matchSearch =
      g.cemetery_name.toLowerCase().includes(search.toLowerCase()) ||
      g.grave_number.toLowerCase().includes(search.toLowerCase()) ||
      getClientName(g).toLowerCase().includes(search.toLowerCase());
    const matchCemetery = cemeteryFilter === "all" || g.cemetery_name === cemeteryFilter;
    return matchSearch && matchCemetery;
  });

  const handleAdd = () => {
    if (!form.client_id || !form.graveyard_id || !form.grave_number) {
      toast({ title: "Chyba", description: "Klient, hřbitov a číslo hrobu jsou povinné.", variant: "destructive" });
      return;
    }
    addGrave.mutate(
      {
        client_id: Number(form.client_id), graveyard_id: Number(form.graveyard_id), grave_number: form.grave_number,
        latitude: parseFloat(form.latitude) || 50.0755, longitude: parseFloat(form.longitude) || 14.4378,
        cleaning_frequency: form.cleaning_frequency, base_price: parseFloat(form.base_price) || 0, notes: form.notes,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ client_id: "", graveyard_id: "", grave_number: "", latitude: "50.0755", longitude: "14.4378", cleaning_frequency: "2x", base_price: "", notes: "" });
          toast({ title: "Hrob přidán" });
        },
        onError: (e) => toast({ title: "Chyba", description: e.message, variant: "destructive" }),
      }
    );
  };

  const handleEditSave = (data: any) => {
    updateGrave.mutate(data, {
      onSuccess: () => toast({ title: "Hrob upraven" }),
      onError: (e) => toast({ title: "Chyba", description: e.message, variant: "destructive" }),
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Smazat tento hrob a všechny související zakázky?")) return;
    deleteGrave.mutate(id, {
      onSuccess: () => toast({ title: "Smazáno" }),
      onError: (e) => toast({ title: "Chyba", description: e.message, variant: "destructive" }),
    });
  };

  const freqLabels: Record<string, string> = { "1x": "1×/rok", "2x": "2×/rok", "4x": "4×/rok", custom: "Vlastní" };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Hroby</h1>
            <p className="page-description">Správa hrobových záznamů a umístění</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Přidat hrob</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Nový hrob</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Klient *</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Vyberte klienta" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Hřbitov *</Label>
                    <Select value={form.graveyard_id} onValueChange={(v) => setForm((f) => ({ ...f, graveyard_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Vyberte hřbitov" /></SelectTrigger>
                      <SelectContent>
                        {graveyards.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Číslo hrobu *</Label><Input value={form.grave_number} onChange={(e) => setForm((f) => ({ ...f, grave_number: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Zeměpisná šířka</Label><Input value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Zeměpisná délka</Label><Input value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Četnost</Label>
                    <Select value={form.cleaning_frequency} onValueChange={(v: any) => setForm((f) => ({ ...f, cleaning_frequency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1x">1×/rok</SelectItem><SelectItem value="2x">2×/rok</SelectItem>
                        <SelectItem value="4x">4×/rok</SelectItem><SelectItem value="custom">Vlastní</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Základní cena (Kč)</Label><Input type="number" value={form.base_price} onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>Poznámky</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Zrušit</Button>
                  <Button onClick={handleAdd} disabled={addGrave.isPending}>Přidat hrob</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Hledat hroby..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={cemeteryFilter} onValueChange={setCemeteryFilter}>
          <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Všechny hřbitovy" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny hřbitovy</SelectItem>
            {cemeteries.map((c) => <SelectItem key={String(c)} value={String(c)}>{String(c)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((grave: any) => (
            <Card key={grave.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{grave.cemetery_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Hrob č. {grave.grave_number}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">{freqLabels[grave.cleaning_frequency]}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditGrave(grave)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(grave.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="text-muted-foreground">Klient: {getClientName(grave)}</p>
                <p className="font-medium">{Number(grave.base_price).toLocaleString()} Kč</p>
                {grave.notes && <p className="text-xs italic text-muted-foreground">{grave.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{graves.length === 0 ? "Zatím žádné hroby. Přidejte první hrob!" : "Nebyly nalezeny žádné hroby odpovídající kritériím."}</p>
        </div>
      )}

      <EditGraveDialog grave={editGrave} clients={clients} graveyards={graveyards} open={!!editGrave} onOpenChange={(o) => !o && setEditGrave(null)} onSave={handleEditSave} />
    </div>
  );
}
