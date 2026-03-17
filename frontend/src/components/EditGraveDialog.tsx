import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Client } from "@/hooks/useClients";
import { Graveyard } from "@/hooks/useGraveyards";

interface EditGraveDialogProps {
  grave: any | null;
  clients: Client[];
  graveyards: Graveyard[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
}

export function EditGraveDialog({ grave, clients, graveyards, open, onOpenChange, onSave }: EditGraveDialogProps) {
  const [form, setForm] = useState({
    client_id: "", graveyard_id: "", grave_number: "", latitude: "", longitude: "",
    cleaning_frequency: "2x" as "1x" | "2x" | "4x" | "custom", base_price: "", notes: "",
  });

  useEffect(() => {
    if (grave) {
      setForm({
        client_id: String(grave.client_id), graveyard_id: String(grave.graveyard_id), grave_number: grave.grave_number,
        latitude: String(grave.latitude), longitude: String(grave.longitude),
        cleaning_frequency: grave.cleaning_frequency, base_price: String(grave.base_price), notes: grave.notes,
      });
    }
  }, [grave]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.graveyard_id || !form.grave_number) {
      toast({ title: "Chyba", description: "Klient, hřbitov a číslo hrobu jsou povinné.", variant: "destructive" });
      return;
    }
    onSave({
      id: grave!.id, client_id: Number(form.client_id), graveyard_id: Number(form.graveyard_id), grave_number: form.grave_number,
      latitude: parseFloat(form.latitude) || 50.0755, longitude: parseFloat(form.longitude) || 14.4378,
      cleaning_frequency: form.cleaning_frequency, base_price: parseFloat(form.base_price) || 0, notes: form.notes,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Upravit hrob</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Klient *</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Vyberte klienta" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Hřbitov *</Label>
              <Select value={form.graveyard_id} onValueChange={(v) => setForm((f) => ({ ...f, graveyard_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Vyberte hřbitov" /></SelectTrigger>
                <SelectContent>{graveyards.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}</SelectContent>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Zrušit</Button>
            <Button type="submit">Uložit</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
