import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClients } from "@/hooks/useClients";
import { useGraves } from "@/hooks/useGraves";
import { useOrders } from "@/hooks/useOrders";
import { useInvoices } from "@/hooks/useInvoices";
import { useReminders } from "@/hooks/useReminders";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Users, MapPin, ClipboardList, FileText, AlertTriangle, Clock, CheckCircle, DollarSign, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { signOut } = useAuth();
  const { data: clients = [], isLoading: cl } = useClients();
  const { data: graves = [], isLoading: gl } = useGraves();
  const { data: orders = [], isLoading: ol } = useOrders();
  const { data: invoices = [] } = useInvoices();
  const { data: reminders = [] } = useReminders();

  const isLoading = cl || gl || ol;

  const completedOrders = orders.filter((o: any) => o.status === "completed");
  const totalRevenue = invoices.reduce((s, i) => s + Number(i.total_price), 0);
  const overdueReminders = reminders.filter((r: any) => r.status === "overdue");
  const dueSoonReminders = reminders.filter((r: any) => r.status === "due-soon");

  const stats = [
    { label: "Aktivní klienti", value: clients.length, icon: Users, color: "text-primary" },
    { label: "Spravované hroby", value: graves.length, icon: MapPin, color: "text-primary" },
    { label: "Celkem zakázek", value: orders.length, icon: ClipboardList, color: "text-primary" },
    { label: "Vystavené faktury", value: invoices.length, icon: FileText, color: "text-primary" },
    { label: "Celkové tržby", value: `${totalRevenue.toLocaleString()} Kč`, icon: DollarSign, color: "text-[hsl(var(--success))]" },
    { label: "Dokončeno", value: completedOrders.length, icon: CheckCircle, color: "text-[hsl(var(--success))]" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Přehled</h1>
          <p className="page-description">Souhrn vašeho podnikání v údržbě hrobů</p>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" /> Odhlásit se
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="stat-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Po termínu</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overdueReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Žádné úkoly po termínu 🎉</p>
            ) : overdueReminders.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-sm p-2 rounded bg-destructive/5">
                <div>
                  <span className="font-medium">{r.clients?.full_name}</span>
                  <span className="text-muted-foreground ml-2">{r.graves?.cemetery_name} #{r.graves?.grave_number}</span>
                </div>
                <Badge className="status-overdue border-0 text-xs">{r.next_date}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-[hsl(var(--warning))]" /> Brzy splatné</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {dueSoonReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Žádné úkoly s blížícím se termínem</p>
            ) : dueSoonReminders.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-sm p-2 rounded bg-[hsl(var(--warning))]/5">
                <div>
                  <span className="font-medium">{r.clients?.full_name}</span>
                  <span className="text-muted-foreground ml-2">{r.graves?.cemetery_name} #{r.graves?.grave_number}</span>
                </div>
                <Badge className="status-due-soon border-0 text-xs">{r.next_date}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
