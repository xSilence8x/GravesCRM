import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useReminders, useAddReminder } from "@/hooks/useReminders";
import { useClients } from "@/hooks/useClients";
import { useGraves } from "@/hooks/useGraves";
import { AlertTriangle, Clock, CalendarCheck, ChevronLeft, ChevronRight, Plus, CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type ReminderStatus = Database["public"]["Enums"]["reminder_status"];

const statusConfig: Record<ReminderStatus, { label: string; className: string; icon: typeof AlertTriangle; bg: string; text: string }> = {
  "po termínu": { label: "Po termínu", className: "status-overdue", icon: AlertTriangle, bg: "bg-destructive/10", text: "text-destructive" },
  "brzy": { label: "Brzy", className: "status-due-soon", icon: Clock, bg: "bg-[hsl(var(--warning))]/10", text: "text-[hsl(var(--warning))]" },
  "nadcházející": { label: "Nadcházející", className: "status-upcoming", icon: CalendarCheck, bg: "bg-primary/10", text: "text-primary" },
  "deaktivovaný": { label: "Deaktivovaný", className: "status-deactivated", icon: CalendarCheck, bg: "bg-muted/10", text: "text-muted-foreground" },
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }

export default function RemindersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReminders, setSelectedReminders] = useState<any[] | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ client_id: "", grave_id: "", next_date: undefined as Date | undefined, status: "upcoming" as ReminderStatus });

  const { data: reminders = [], isLoading } = useReminders();
  const { data: clients = [] } = useClients();
  const { data: graves = [] } = useGraves();
  const addReminder = useAddReminder();

  const clientGraves = graves.filter((g: any) => g.client_id === form.client_id);

  const filtered = reminders.filter((r: any) => statusFilter === "all" || r.status === statusFilter);

  const remindersByDate = new Map<string, any[]>();
  filtered.forEach((r: any) => {
    const existing = remindersByDate.get(r.next_date) || [];
    existing.push(r);
    remindersByDate.set(r.next_date, existing);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const today = new Date().toISOString().slice(0, 10);

  const cells: (null | number)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const handleAdd = () => {
    if (!form.client_id || !form.grave_id || !form.next_date) {
      toast({ title: "Error", description: "Client, grave, and date are required.", variant: "destructive" });
      return;
    }
    addReminder.mutate(
      { client_id: form.client_id, grave_id: form.grave_id, next_date: format(form.next_date, "yyyy-MM-dd"), status: form.status },
      {
        onSuccess: () => { setAddOpen(false); setForm({ client_id: "", grave_id: "", next_date: undefined, status: "upcoming" }); toast({ title: "Reminder created" }); },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Maintenance Reminders</h1>
          <p className="page-description">Upcoming and overdue maintenance tasks</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="due-soon">Due Soon</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Reminder</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>New Reminder</DialogTitle></DialogHeader>
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
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left", !form.next_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.next_date ? format(form.next_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={form.next_date} onSelect={(d) => setForm((f) => ({ ...f, next_date: d }))} className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v: any) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="due-soon">Due Soon</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleAdd} disabled={addReminder.isPending}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[500px] rounded-xl" />
      ) : reminders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No reminders yet</p>
          <p className="text-sm mt-1">Add your first reminder to see it on the calendar.</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-lg font-semibold">{MONTHS[month]} {year}</h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-7 border-b">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-2 text-xs font-medium text-muted-foreground text-center border-r last:border-r-0">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} className="min-h-[100px] border-r border-b bg-muted/10" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayReminders = remindersByDate.get(dateStr) || [];
              const isToday = dateStr === today;

              return (
                <div key={dateStr} onClick={() => dayReminders.length > 0 && setSelectedReminders(dayReminders)}
                  className={`min-h-[100px] border-r border-b p-1.5 transition-colors ${dayReminders.length > 0 ? "cursor-pointer hover:bg-accent/30" : ""} ${isToday ? "bg-primary/5" : ""}`}>
                  <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>{day}</div>
                  <div className="space-y-0.5">
                    {dayReminders.slice(0, 3).map((r: any) => (
                      <div key={r.id} className={`text-[11px] leading-tight px-1.5 py-0.5 rounded truncate ${
                        r.status === "overdue" ? "bg-destructive/10 text-destructive" :
                        r.status === "due-soon" ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" :
                        "bg-primary/10 text-primary"
                      }`}>
                        {r.clients?.full_name ?? "—"}
                      </div>
                    ))}
                    {dayReminders.length > 3 && <div className="text-[10px] text-muted-foreground px-1.5">+{dayReminders.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Dialog open={!!selectedReminders} onOpenChange={(open) => !open && setSelectedReminders(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Reminder Details</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedReminders?.map((r: any) => {
              const config = statusConfig[r.status as ReminderStatus];
              const Icon = config.icon;
              return (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.text}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{r.clients?.full_name ?? "—"}</p>
                        <p className="text-sm text-muted-foreground">{r.graves?.cemetery_name} / #{r.graves?.grave_number}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">{r.next_date}</span>
                          <Badge className={`${config.className} border-0 text-xs`}>{config.label}</Badge>
                        </div>
                        {r.graves && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Base price: {Number(r.graves.base_price).toLocaleString()} CZK · Frequency: {r.graves.cleaning_frequency}/year
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
