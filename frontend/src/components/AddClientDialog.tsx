import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AddClientDialogProps {
  onAdd: (client: {
    firstName: string;
    lastName: string;
    company: string;
    ico: string;
    email: string;
    phone: string;
    billingAddress: string;
    notes: string;
  }) => void;
}

export function AddClientDialog({ onAdd }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    ico: "",
    email: "",
    phone: "",
    billingAddress: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() && !form.lastName.trim() && !form.company.trim()) {
      toast({ title: "Chyba", description: "Musí být vyplněno alespoň jméno nebo společnost.", variant: "destructive" });
      return;
    }
    onAdd(form);
    setForm({ firstName: "", lastName: "", company: "", ico: "", email: "", phone: "", billingAddress: "", notes: "" });
    setOpen(false);
    toast({ title: "Klient přidán", description: `${form.firstName} ${form.lastName} ${form.company}` });
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Přidat klienta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nový klient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Křestní jméno</Label>
            <Input id="firstName" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="Jan" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Příjmení</Label>
            <Input id="lastName" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Novák" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Společnost</Label>
            <Input id="company" value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Firma s.r.o." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ico">IČO</Label>
            <Input id="ico" value={form.ico} onChange={(e) => update("ico", e.target.value)} placeholder="12345678" maxLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.cz" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+420 ..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billingAddress">Fakturační adresa</Label>
            <Input id="billingAddress" value={form.billingAddress} onChange={(e) => update("billingAddress", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Poznámky</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Zrušit</Button>
            <Button type="submit">Přidat klienta</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
