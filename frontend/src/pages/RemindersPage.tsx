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
import {
  GoogleCalendarEvent,
  useGoogleCalendarDisconnect,
  useGoogleCalendarEvents,
  useGoogleCalendarStatus,
  useGoogleCalendarSync,
} from "@/hooks/useGoogleCalendar";
import { AlertTriangle, Clock, CalendarCheck, ChevronLeft, ChevronRight, Plus, CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ReminderStatus } from "@/types/api";

const statusConfig: Record<ReminderStatus, { label: string; className: string; icon: typeof AlertTriangle; bg: string; text: string }> = {
  overdue: { label: "Po termínu", className: "status-overdue", icon: AlertTriangle, bg: "bg-destructive/10", text: "text-destructive" },
  "due-soon": { label: "Brzy", className: "status-due-soon", icon: Clock, bg: "bg-[hsl(var(--warning))]/10", text: "text-[hsl(var(--warning))]" },
  upcoming: { label: "Nadcházející", className: "status-upcoming", icon: CalendarCheck, bg: "bg-primary/10", text: "text-primary" },
};

function normalizeReminderStatus(status: string): ReminderStatus | "hidden" {
  if (status === "overdue" || status === "due-soon" || status === "upcoming") return status;
  if (status === "po termínu") return "overdue";
  if (status === "brzy") return "due-soon";
  if (status === "nadcházející") return "upcoming";
  if (status === "deaktivovaný" || status === "deactivated") return "hidden";
  return "upcoming";
}

const WEEKDAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const MONTHS = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }

function eachDate(start: string, endExclusive: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${endExclusive}T00:00:00`);

  while (cursor < endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export default function RemindersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDayData, setSelectedDayData] = useState<{ reminders: any[]; googleEvents: GoogleCalendarEvent[] } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ client_id: "", grave_id: "", next_date: undefined as Date | undefined, status: "upcoming" as ReminderStatus });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const rangeStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const rangeEnd = `${year}-${String(month + 2).padStart(2, "0")}-01`;

  const { data: reminders = [], isLoading } = useReminders();
  const { data: clients = [] } = useClients();
  const { data: graves = [] } = useGraves();
  const { data: googleStatus } = useGoogleCalendarStatus();
  const { data: googleEvents = [] } = useGoogleCalendarEvents(rangeStart, rangeEnd);
  const syncGoogle = useGoogleCalendarSync();
  const disconnectGoogle = useGoogleCalendarDisconnect();
  const addReminder = useAddReminder();

  const clientGraves = graves.filter((g: any) => g.client_id === form.client_id);

  const filtered = reminders.filter((r: any) => {
    const normalizedStatus = normalizeReminderStatus(String(r.status ?? ""));
    if (normalizedStatus === "hidden") return false;
    return statusFilter === "all" || normalizedStatus === statusFilter;
  });

  const remindersByDate = new Map<string, any[]>();
  filtered.forEach((r: any) => {
    const existing = remindersByDate.get(r.next_date) || [];
    existing.push(r);
    remindersByDate.set(r.next_date, existing);
  });

  const googleEventsByDate = new Map<string, GoogleCalendarEvent[]>();
  googleEvents.forEach((event) => {
    const keys = event.is_all_day && event.start_date && event.end_date
      ? eachDate(event.start_date, event.end_date)
      : [event.starts_at?.slice(0, 10)].filter(Boolean) as string[];

    keys.forEach((key) => {
      const current = googleEventsByDate.get(key) || [];
      current.push(event);
      googleEventsByDate.set(key, current);
    });
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const today = new Date().toISOString().slice(0, 10);

  const cells: (null | number)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const handleAdd = () => {
    if (!form.client_id || !form.grave_id || !form.next_date) {
      toast({ title: "Chyba", description: "Klient, hrob a datum jsou povinné.", variant: "destructive" });
      return;
    }
    addReminder.mutate(
      { client_id: Number(form.client_id), grave_id: Number(form.grave_id), next_date: format(form.next_date, "yyyy-MM-dd"), status: form.status },
      {
        onSuccess: () => { setAddOpen(false); setForm({ client_id: "", grave_id: "", next_date: undefined, status: "upcoming" }); toast({ title: "Připomínka vytvořena" }); },
        onError: (e) => toast({ title: "Chyba", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Připomínky údržby</h1>
          <p className="page-description">Nadcházející a opožděné úkoly údržby</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Všechny stavy" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny stavy</SelectItem>
              <SelectItem value="overdue">Po termínu</SelectItem>
              <SelectItem value="due-soon">Brzy</SelectItem>
              <SelectItem value="upcoming">Nadcházející</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Přidat připomínku</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Nová připomínka</DialogTitle></DialogHeader>
              <div className="space-y-3">
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
                  <Label>Datum *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left", !form.next_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.next_date ? format(form.next_date, "PPP") : "Vyberte datum"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={form.next_date} onSelect={(d) => setForm((f) => ({ ...f, next_date: d }))} className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label>Stav</Label>
                  <Select value={form.status} onValueChange={(v: any) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Nadcházející</SelectItem>
                      <SelectItem value="due-soon">Brzy</SelectItem>
                      <SelectItem value="overdue">Po termínu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddOpen(false)}>Zrušit</Button>
                  <Button onClick={handleAdd} disabled={addReminder.isPending}>Vytvořit</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Google kalendář</p>
              <p className="text-xs text-muted-foreground">
                {googleStatus?.connected
                  ? `Připojeno: ${googleStatus.google_email || "Google účet"}`
                  : "Kalendář není spárovaný"}
              </p>
              {googleStatus?.last_synced_at && (
                <p className="text-xs text-muted-foreground">Poslední synchronizace: {new Date(googleStatus.last_synced_at).toLocaleString("cs-CZ")}</p>
              )}
            </div>
            <div className="flex gap-2">
              {!googleStatus?.connected ? (
                <Button onClick={() => { window.location.href = "/api/google-calendar/oauth/start"; }}>
                  Spárovat kalendář
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => syncGoogle.mutate()} disabled={syncGoogle.isPending}>
                    Synchronizovat
                  </Button>
                  <Button variant="destructive" onClick={() => disconnectGoogle.mutate()} disabled={disconnectGoogle.isPending}>
                    Odpojit
                  </Button>
                </>
              )}
            </div>
          </div>

          {googleStatus?.team?.length ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Legenda týmových kalendářů</p>
              <div className="flex flex-wrap gap-2">
                {googleStatus.team.map((member) => (
                  <div
                    key={member.user_id}
                    className="text-xs px-2 py-1 rounded border"
                    style={{ borderColor: member.color, color: member.color }}
                  >
                    {member.nickname}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-[500px] rounded-xl" />
      ) : reminders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">Zatím žádné připomínky</p>
          <p className="text-sm mt-1">Přidejte první připomínku a zobrazí se v kalendáři.</p>
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
              const dayGoogleEvents = googleEventsByDate.get(dateStr) || [];
              const isToday = dateStr === today;

              return (
                <div
                  key={dateStr}
                  onClick={() => (dayReminders.length > 0 || dayGoogleEvents.length > 0) && setSelectedDayData({ reminders: dayReminders, googleEvents: dayGoogleEvents })}
                  className={`min-h-[100px] border-r border-b p-1.5 transition-colors ${(dayReminders.length > 0 || dayGoogleEvents.length > 0) ? "cursor-pointer hover:bg-accent/30" : ""} ${isToday ? "bg-primary/5" : ""}`}
                >
                  <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>{day}</div>
                  <div className="space-y-0.5">
                    {dayReminders.slice(0, 2).map((r: any) => (
                      (() => {
                        const normalizedStatus = normalizeReminderStatus(String(r.status ?? ""));
                        const graveName = r.graves?.name_on_grave || r.clients?.full_name || "—";
                        return (
                      <div key={r.id} className={`text-[11px] leading-tight px-1.5 py-0.5 rounded truncate ${
                        normalizedStatus === "overdue" ? "bg-destructive/10 text-destructive" :
                        normalizedStatus === "due-soon" ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" :
                        "bg-primary/10 text-primary"
                      }`}>
                        {graveName}
                      </div>
                        );
                      })()
                    ))}
                    {dayGoogleEvents.slice(0, 2).map((gEvent) => (
                      <div
                        key={`${gEvent.user_id}-${gEvent.id}`}
                        className="text-[11px] leading-tight px-1.5 py-0.5 rounded truncate border"
                        style={{ borderColor: gEvent.user_color, color: gEvent.user_color, backgroundColor: `${gEvent.user_color}22` }}
                      >
                        {gEvent.summary}
                      </div>
                    ))}
                    {(dayReminders.length + dayGoogleEvents.length) > 4 && (
                      <div className="text-[10px] text-muted-foreground px-1.5">+{dayReminders.length + dayGoogleEvents.length - 4} dalších</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Dialog open={!!selectedDayData} onOpenChange={(open) => !open && setSelectedDayData(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Detail připomínek</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedDayData?.reminders.map((r: any) => {
              const config = statusConfig[normalizeReminderStatus(String(r.status ?? ""))];
              const Icon = config.icon;
              return (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.text}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{r.graves?.name_on_grave || r.clients?.full_name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{r.graves?.cemetery_name} / #{r.graves?.grave_number}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">{r.next_date}</span>
                          <Badge className={`${config.className} border-0 text-xs`}>{config.label}</Badge>
                        </div>
                        {r.graves && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Základní cena: {Number(r.graves.base_price).toLocaleString()} Kč · Četnost: {r.graves.cleaning_frequency}/rok
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {selectedDayData?.googleEvents.map((event) => (
              <Card key={`${event.user_id}-${event.id}`}>
                <CardContent className="p-4">
                  <p className="text-sm font-semibold" style={{ color: event.user_color }}>{event.summary}</p>
                  <p className="text-xs text-muted-foreground">{event.user_nickname}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.is_all_day
                      ? `Celý den (${event.start_date})`
                      : `${event.starts_at ? new Date(event.starts_at).toLocaleString("cs-CZ") : ""} – ${event.ends_at ? new Date(event.ends_at).toLocaleString("cs-CZ") : ""}`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
