import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Plus, Camera, ChevronDown, ChevronUp, Upload, CalendarIcon, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useOrders, useAddOrder, useUpdateOrder, useDeleteOrder, useUploadPhoto } from "@/hooks/useOrders";
import { useClients } from "@/hooks/useClients";
import { useGraves } from "@/hooks/useGraves";
import { EditOrderDialog } from "@/components/EditOrderDialog";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusStyles: Record<OrderStatus, string> = {
  planned: "status-planned",
  "in-progress": "status-in-progress",
  completed: "status-completed",
  cancelled: "status-cancelled",
};
const statusLabels: Record<OrderStatus, string> = {
  planned: "Planned", "in-progress": "In Progress", completed: "Completed", cancelled: "Cancelled",
};

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<any | null>(null);
  const [photoUpload, setPhotoUpload] = useState<{ orderId: string; type: "before" | "after" } | null>(null);

  const { data: orders = [], isLoading } = useOrders();
  const { data: clients = [] } = useClients();
  const { data: graves = [] } = useGraves();
  const addOrder = useAddOrder();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();
  const uploadPhoto = useUploadPhoto();

  const [form, setForm] = useState({ client_id: "", grave_id: "", planned_date: undefined as Date | undefined, notes: "" });

  const clientGraves = graves.filter((g: any) => g.client_id === form.client_id);

  const filtered = orders.filter((o: any) => {
    const clientName = o.clients?.full_name ?? "";
    const graveLabel = `${o.graves?.cemetery_name ?? ""} ${o.graves?.grave_number ?? ""}`;
    const matchSearch = clientName.toLowerCase().includes(search.toLowerCase()) || graveLabel.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdd = () => {
    if (!form.client_id || !form.grave_id || !form.planned_date) {
      toast({ title: "Error", description: "Client, grave, and date are required.", variant: "destructive" });
      return;
    }
    addOrder.mutate(
      { client_id: form.client_id, grave_id: form.grave_id, planned_date: format(form.planned_date, "yyyy-MM-dd"), notes: form.notes },
      {
        onSuccess: () => { setOpen(false); setForm({ client_id: "", grave_id: "", planned_date: undefined, notes: "" }); toast({ title: "Order created" }); },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  const handleStatusChange = (id: string, status: OrderStatus) => {
    const updates: any = { id, status };
    if (status === "completed") updates.completion_date = new Date().toISOString().slice(0, 10);
    updateOrder.mutate(updates);
  };

  const handleEditSave = (data: any) => {
    updateOrder.mutate(data, {
      onSuccess: () => toast({ title: "Order updated" }),
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!photoUpload || !e.target.files?.[0]) return;
    uploadPhoto.mutate(
      { orderId: photoUpload.orderId, file: e.target.files[0], type: photoUpload.type },
      {
        onSuccess: () => { setPhotoUpload(null); toast({ title: "Photo uploaded" }); },
        onError: (err) => toast({ title: "Upload error", description: err.message, variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Maintenance Orders</h1>
            <p className="page-description">Track and manage all maintenance work</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Order</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>New Maintenance Order</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Client *</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v, grave_id: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Grave *</Label>
                  <Select value={form.grave_id} onValueChange={(v) => setForm((f) => ({ ...f, grave_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select grave" /></SelectTrigger>
                    <SelectContent>
                      {clientGraves.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.cemetery_name} / #{g.grave_number}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Planned Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left", !form.planned_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.planned_date ? format(form.planned_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={form.planned_date} onSelect={(d) => setForm((f) => ({ ...f, planned_date: d }))} className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleAdd} disabled={addOrder.isPending}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order: any) => {
            const expanded = expandedOrder === order.id;
            const photos = order.photos || [];
            const services = order.additional_services || [];

            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpandedOrder(expanded ? null : order.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">
                          {order.graves?.cemetery_name} / #{order.graves?.grave_number}
                        </CardTitle>
                        <Badge className={`${statusStyles[order.status as OrderStatus]} border-0 text-xs`}>
                          {statusLabels[order.status as OrderStatus]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{order.clients?.full_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold">{Number(order.total_price).toLocaleString()} CZK</p>
                        <p className="text-xs text-muted-foreground">{order.planned_date}</p>
                      </div>
                      {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>

                {expanded && (
                  <CardContent className="border-t pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Planned:</span> <span className="font-medium">{order.planned_date}</span></div>
                      <div><span className="text-muted-foreground">Completed:</span> <span className="font-medium">{order.completion_date ?? "—"}</span></div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Label className="text-xs font-medium">Change status:</Label>
                      {(["planned", "in-progress", "completed", "cancelled"] as OrderStatus[]).map((s) => (
                        <Button key={s} size="sm" variant={order.status === s ? "default" : "outline"} className="text-xs h-7"
                          onClick={() => handleStatusChange(order.id, s)}>
                          {statusLabels[s]}
                        </Button>
                      ))}
                    </div>

                    {services.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Additional Services</p>
                        <div className="space-y-1">
                          {services.map((s: any) => (
                            <div key={s.id} className="flex justify-between text-sm p-2 rounded bg-muted/50">
                              <span>{s.name}</span>
                              <span className="font-medium">{Number(s.price).toLocaleString()} CZK</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Camera className="h-4 w-4" /> Photos ({photos.length})
                      </p>
                      {photos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                          {photos.map((p: any) => (
                            <div key={p.id} className="relative rounded-lg overflow-hidden border aspect-square">
                              <img src={p.url} alt={p.note || `${p.type} photo`} className="w-full h-full object-cover" />
                              <Badge className={`absolute top-1 left-1 text-[10px] ${p.type === "before" ? "bg-destructive/80 text-destructive-foreground" : "bg-[hsl(var(--success))]/80 text-[hsl(var(--success-foreground))]"} border-0`}>
                                {p.type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => setPhotoUpload({ orderId: order.id, type: "before" })}>
                          <Upload className="h-3 w-3 mr-1" /> Before
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => setPhotoUpload({ orderId: order.id, type: "after" })}>
                          <Upload className="h-3 w-3 mr-1" /> After
                        </Button>
                      </div>
                    </div>

                    {order.notes && <p className="text-sm text-muted-foreground italic">{order.notes}</p>}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditOrder(order); }}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Order
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => { if (confirm("Delete this order?")) deleteOrder.mutate(order.id); }}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Order
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{orders.length === 0 ? "No orders yet. Create your first maintenance order!" : "No orders found matching your criteria."}</p>
        </div>
      )}

      {/* Hidden file input for photo upload */}
      {photoUpload && (
        <input type="file" accept="image/*" className="hidden" ref={(el) => el?.click()}
          onChange={handlePhotoUpload} onBlur={() => setPhotoUpload(null)} />
      )}

      <EditOrderDialog order={editOrder} clients={clients} graves={graves} open={!!editOrder} onOpenChange={(o) => !o && setEditOrder(null)} onSave={handleEditSave} />
    </div>
  );
}
