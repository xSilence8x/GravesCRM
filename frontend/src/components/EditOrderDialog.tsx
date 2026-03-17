import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Client } from "@/hooks/useClients";

interface EditOrderDialogProps {
  order: any | null;
  clients: Client[];
  graves: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
}

export function EditOrderDialog({ order, clients, graves, open, onOpenChange, onSave }: EditOrderDialogProps) {
  const [form, setForm] = useState({ client_id: "", grave_id: "", planned_date: undefined as Date | undefined, notes: "", total_price: "" });

  useEffect(() => {
    if (order) {
      setForm({
        client_id: String(order.client_id), grave_id: String(order.grave_id),
        planned_date: order.planned_date ? parseISO(order.planned_date) : undefined,
        notes: order.notes, total_price: String(order.total_price),
      });
    }
  }, [order]);

  const clientGraves = graves.filter((g: any) => g.client_id === Number(form.client_id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.grave_id || !form.planned_date) {
      toast({ title: "Chyba", description: "Klient, hrob a datum jsou povinné.", variant: "destructive" });
      return;
    }
    onSave({
      id: order!.id, client_id: Number(form.client_id), grave_id: Number(form.grave_id),
      planned_date: format(form.planned_date, "yyyy-MM-dd"), notes: form.notes,
      total_price: parseFloat(form.total_price) || 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Upravit zakázku</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Klient *</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v, grave_id: "" }))}>
              <SelectTrigger><SelectValue placeholder="Vyberte klienta" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Hrob *</Label>
            <Select value={form.grave_id} onValueChange={(v) => setForm((f) => ({ ...f, grave_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Vyberte hrob" /></SelectTrigger>
              <SelectContent>
                {clientGraves.map((g: any) => <SelectItem key={g.id} value={String(g.id)}>{g.cemetery_name} / #{g.grave_number}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Plánované datum *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left", !form.planned_date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.planned_date ? format(form.planned_date, "PPP") : "Vyberte datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={form.planned_date} onSelect={(d) => setForm((f) => ({ ...f, planned_date: d }))} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <Label>Celková cena (Kč)</Label>
            <Input type="number" value={form.total_price} onChange={(e) => setForm((f) => ({ ...f, total_price: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Poznámky</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Zrušit</Button>
            <Button type="submit">Uložit</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
