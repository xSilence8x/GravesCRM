import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInvoices, useAddInvoice } from "@/hooks/useInvoices";
import { useOrders } from "@/hooks/useOrders";
import { FileText, Download, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvoicesPage() {
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: orders = [] } = useOrders();
  const addInvoice = useAddInvoice();

  const completedWithoutInvoice = orders.filter(
    (o: any) => o.status === "completed" && !invoices.some((i) => i.order_id === o.id)
  );

  const generateInvoice = (order: any) => {
    const num = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, "0")}`;
    addInvoice.mutate(
      { order_id: order.id, invoice_number: num, total_price: order.total_price },
      {
        onSuccess: () => toast({ title: "Faktura vytvořena", description: num }),
        onError: (e) => toast({ title: "Chyba", description: e.message, variant: "destructive" }),
      }
    );
  };

  const downloadPdf = async (invoice: any) => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    const order = invoice.maintenance_orders;
    const client = order?.clients;

    doc.setFontSize(20);
    doc.text("FAKTURA", 14, 22);
    doc.setFontSize(10);
    doc.text(`Číslo faktury: ${invoice.invoice_number}`, 14, 32);
    doc.text(`Datum vystavení: ${invoice.issue_date}`, 14, 38);
    doc.text(`Datum splatnosti: ${invoice.due_date}`, 14, 44);

    doc.text("Odběratel:", 14, 56);
    doc.setFontSize(11);
    doc.text(client?.full_name ?? "—", 14, 62);
    doc.setFontSize(9);
    doc.text(client?.billing_address ?? "", 14, 68);
    doc.text(`${client?.email ?? ""} | ${client?.phone ?? ""}`, 14, 74);

    const rows = [
      ["Základní údržba", `${order?.graves?.cemetery_name} #${order?.graves?.grave_number}`, `${Number(order?.total_price ?? 0).toLocaleString()} Kč`],
    ];
    (order?.additional_services || []).forEach((s: any) => {
      rows.push([s.name, s.note || "", `${Number(s.price).toLocaleString()} Kč`]);
    });

    autoTable(doc, { startY: 82, head: [["Služba", "Detail", "Cena"]], body: rows });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 120;
    doc.setFontSize(12);
    doc.text(`Celkem: ${Number(invoice.total_price).toLocaleString()} Kč`, 14, finalY + 12);

    doc.save(`${invoice.invoice_number}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Faktury</h1>
        <p className="page-description">Vystavování a správa faktur</p>
      </div>

      {completedWithoutInvoice.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Dokončené zakázky bez faktury:</p>
            <div className="space-y-2">
              {completedWithoutInvoice.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between">
                  <span className="text-sm">{o.graves?.cemetery_name} #{o.graves?.grave_number} — {o.clients?.full_name}</span>
                  <Button size="sm" onClick={() => generateInvoice(o)}><Plus className="h-3 w-3 mr-1" /> Vytvořit</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv: any) => {
            const order = inv.maintenance_orders;
            const client = order?.clients;
            return (
              <Card key={inv.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">{inv.invoice_number}</CardTitle>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => downloadPdf(inv)}>
                      <Download className="h-3.5 w-3.5 mr-1" /> PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>Klient: <span className="font-medium">{client?.full_name ?? "—"}</span></p>
                  <p>Hrob: {order?.graves?.cemetery_name} #{order?.graves?.grave_number}</p>
                  <div className="flex gap-4">
                    <span>Vystaveno: {inv.issue_date}</span>
                    <span>Splatnost: {inv.due_date}</span>
                  </div>
                  <p className="font-semibold">{Number(inv.total_price).toLocaleString()} Kč</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && invoices.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Zatím žádné faktury. Dokončete zakázku a vytvořte první.</p>
        </div>
      )}
    </div>
  );
}
