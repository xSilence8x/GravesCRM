import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Phone, MapPin, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddClientDialog } from "@/components/AddClientDialog";
import { EditClientDialog } from "@/components/EditClientDialog";
import { useClients, useAddClient, useUpdateClient, useDeleteClient, Client } from "@/hooks/useClients";
import { useGraves } from "@/hooks/useGraves";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [editClient, setEditClient] = useState<Client | null>(null);
  const { data: clients = [], isLoading } = useClients();
  const { data: graves = [] } = useGraves();
  const addClient = useAddClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const filtered = clients.filter(
    (c) =>
      ((c.first_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.last_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.company || "").toLowerCase().includes(search.toLowerCase())) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search)
  );

  const getGraveCount = (clientId: number) =>
    graves.filter((g: any) => g.client_id === clientId).length;

  const handleAddClient = (data: { firstName: string; lastName: string; company: string; email: string; phone: string; billingAddress: string; notes: string }) => {
    addClient.mutate(
      {
        first_name: data.firstName,
        last_name: data.lastName,
        company: data.company,
        email: data.email,
        phone: data.phone,
        billing_address: data.billingAddress,
        notes: data.notes,
      },
      { onError: (e) => toast({ title: "Chyba", description: e.message, variant: "destructive" }) }
    );
  };

  const handleEditSave = (data: { id: number; full_name: string; email: string; phone: string; billing_address: string; notes: string }) => {
    updateClient.mutate(data, {
      onSuccess: () => toast({ title: "Client updated" }),
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete client "${name}" and all related data?`)) return;
    deleteClient.mutate(id, {
      onSuccess: () => toast({ title: "Deleted", description: `${name} removed.` }),
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Clients</h1>
            <p className="page-description">Manage your client directory</p>
          </div>
          <AddClientDialog onAdd={handleAddClient} />
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{[client.first_name, client.last_name].filter(Boolean).join(" ") || client.company || "—"}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {getGraveCount(client.id)} hrobů
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditClient(client)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(client.id, [client.first_name, client.last_name].filter(Boolean).join(" ") || client.company || "—")}> 
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {client.email || "—"}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {client.phone || "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{client.billing_address}</p>
                {client.notes && (
                  <p className="text-xs italic text-muted-foreground border-t pt-2 mt-2">{client.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{clients.length === 0 ? "No clients yet. Add your first client!" : "No clients found matching your search."}</p>
        </div>
      )}

      <EditClientDialog client={editClient} open={!!editClient} onOpenChange={(o) => !o && setEditClient(null)} onSave={handleEditSave} />
    </div>
  );
}
