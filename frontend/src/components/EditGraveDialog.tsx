import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Client } from "@/hooks/useClients";

interface EditGraveDialogProps {
  grave: any | null;
  clients: Client[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
}

export function EditGraveDialog({ grave, clients, open, onOpenChange, onSave }: EditGraveDialogProps) {
  const [form, setForm] = useState({
    client_id: "", cemetery_name: "", grave_number: "", latitude: "", longitude: "",
    cleaning_frequency: "2x" as "1x" | "2x" | "4x" | "custom", base_price: "", notes: "",
  });

  useEffect(() => {
    if (grave) {
      setForm({
        client_id: grave.client_id, cemetery_name: grave.cemetery_name, grave_number: grave.grave_number,
        latitude: String(grave.latitude), longitude: String(grave.longitude),
        cleaning_frequency: grave.cleaning_frequency, base_price: String(grave.base_price), notes: grave.notes,
      });
    }
  }, [grave]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.cemetery_name || !form.grave_number) {
      toast({ title: "Error", description: "Client, cemetery, and grave number are required.", variant: "destructive" });
      return;
    }
    onSave({
      id: grave!.id, client_id: form.client_id, cemetery_name: form.cemetery_name, grave_number: form.grave_number,
      latitude: parseFloat(form.latitude) || 50.0755, longitude: parseFloat(form.longitude) || 14.4378,
      cleaning_frequency: form.cleaning_frequency, base_price: parseFloat(form.base_price) || 0, notes: form.notes,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit Grave</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Client *</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
