import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Client } from "@/hooks/useClients";

interface EditClientDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { id: number; first_name: string; last_name: string; company: string; ico: string; email: string; phone: string; billing_address: string; notes: string }) => void;
}

export function EditClientDialog({ client, open, onOpenChange, onSave }: EditClientDialogProps) {
  const [form, setForm] = useState({ first_name: "", last_name: "", company: "", ico: "", email: "", phone: "", billing_address: "", notes: "" });

  useEffect(() => {
    if (client) {
      setForm({
        first_name: client.first_name || "",
        last_name: client.last_name || "",
        company: client.company || "",
        ico: client.ico || "",
        email: client.email || "",
        phone: client.phone || "",
        billing_address: client.billing_address || "",
        notes: client.notes || "",
      });
    }
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() && !form.last_name.trim() && !form.company.trim()) {
      toast({ title: "Chyba", description: "Musí být vyplněno alespoň jméno nebo společnost.", variant: "destructive" });
      return;
    }
    onSave({ id: client!.id, ...form });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Upravit klienta</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Křestní jméno</Label>
            <Input id="firstName" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} placeholder="Jan" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Příjmení</Label>
            <Input id="lastName" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} placeholder="Novák" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Společnost</Label>
            <Input id="company" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Firma s.r.o." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ico">IČO</Label>
            <Input id="ico" value={form.ico} onChange={(e) => setForm((f) => ({ ...f, ico: e.target.value }))} placeholder="12345678" maxLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.cz" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+420 ..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billingAddress">Fakturační adresa</Label>
            <Input id="billingAddress" value={form.billing_address} onChange={(e) => setForm((f) => ({ ...f, billing_address: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Poznámky</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
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
