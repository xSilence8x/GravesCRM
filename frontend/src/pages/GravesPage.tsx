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
  const addGrave = useAddGrave();
  const updateGrave = useUpdateGrave();
  const deleteGrave = useDeleteGrave();

  const [form, setForm] = useState({
    client_id: "", cemetery_name: "", grave_number: "", latitude: "50.0755", longitude: "14.4378",
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
    if (!form.client_id || !form.cemetery_name || !form.grave_number) {
      toast({ title: "Error", description: "Client, cemetery, and grave number are required.", variant: "destructive" });
      return;
    }
    addGrave.mutate(
      {
        client_id: form.client_id, cemetery_name: form.cemetery_name, grave_number: form.grave_number,
        latitude: parseFloat(form.latitude) || 50.0755, longitude: parseFloat(form.longitude) || 14.4378,
        cleaning_frequency: form.cleaning_frequency, base_price: parseFloat(form.base_price) || 0, notes: form.notes,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ client_id: "", cemetery_name: "", grave_number: "", latitude: "50.0755", longitude: "14.4378", cleaning_frequency: "2x", base_price: "", notes: "" });
          toast({ title: "Grave added" });
        },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  const handleEditSave = (data: any) => {
    updateGrave.mutate(data, {
      onSuccess: () => toast({ title: "Grave updated" }),
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this grave and all related orders?")) return;
    deleteGrave.mutate(id, {
      onSuccess: () => toast({ title: "Deleted" }),
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const freqLabels: Record<string, string> = { "1x": "1×/year", "2x": "2×/year", "4x": "4×/year", custom: "Custom" };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Graves</h1>
            <p className="page-description">Manage grave records and locations</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Grave</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Add New Grave</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Client *</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Cemetery *</Label><Input value={form.cemetery_name} onChange={(e) => setForm((f) => ({ ...f, cemetery_name: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Grave # *</Label><Input value={form.grave_number} onChange={(e) => setForm((f) => ({ ...f, grave_number: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Latitude</Label><Input value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Longitude</Label><Input value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Frequency</Label>
                    <Select value={form.cleaning_frequency} onValueChange={(v: any) => setForm((f) => ({ ...f, cleaning_frequency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1x">1×/year</SelectItem><SelectItem value="2x">2×/year</SelectItem>
                        <SelectItem value="4x">4×/year</SelectItem><SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Base Price (CZK)</Label><Input type="number" value={form.base_price} onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleAdd} disabled={addGrave.isPending}>Add Grave</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search graves..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={cemeteryFilter} onValueChange={setCemeteryFilter}>
          <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="All cemeteries" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cemeteries</SelectItem>
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
                    <p className="text-sm text-muted-foreground">Grave #{grave.grave_number}</p>
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
                <p className="text-muted-foreground">Client: {getClientName(grave)}</p>
                <p className="font-medium">{Number(grave.base_price).toLocaleString()} CZK</p>
                {grave.notes && <p className="text-xs italic text-muted-foreground">{grave.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{graves.length === 0 ? "No graves yet. Add your first grave!" : "No graves found matching your criteria."}</p>
        </div>
      )}

      <EditGraveDialog grave={editGrave} clients={clients} open={!!editGrave} onOpenChange={(o) => !o && setEditGrave(null)} onSave={handleEditSave} />
    </div>
  );
}
