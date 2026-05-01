import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInvoices, useAddInvoice, useDeleteInvoice } from "@/hooks/useInvoices";
import { useGraves } from "@/hooks/useGraves";
import { statusLabels } from "@/lib/status";
import { FileText, Download, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { registerPdfFonts } from "@/lib/pdfFonts";

const getStatusVariant = (
  status: string
): "planned" | "inProgress" | "completed" | "cancelled" | "outline" => {
  switch (status) {
    case "plánováno":
      return "planned";
    case "probíhá":
      return "inProgress";
    case "dokončeno":
      return "completed";
    case "zrušeno":
      return "cancelled";
    default:
      return "outline";
  }
};

const formatCurrency = (value: unknown) =>
  `${Number(value ?? 0).toLocaleString("cs-CZ")} Kč`;

const getClientName = (grave: any) =>
  grave?.client?.full_name ?? grave?.clients?.full_name ?? "—";

const getClient = (grave: any) => grave?.client ?? grave?.clients;

const getGraveyardName = (grave: any) =>
  grave?.graveyard?.name ??
  grave?.graveyards?.name ??
  grave?.cemetery_name ??
  "—";

const getGraveLabel = (grave: any) =>
  `${getGraveyardName(grave)} #${grave?.grave_number ?? "—"}${
    grave?.name_on_grave ? `: ${grave.name_on_grave}` : ""
  }`;

const getGraveTotalPrice = (grave: any) => {
  const basePrice = Number(grave?.base_price ?? 0);

  const servicesTotal = (grave?.additional_services ?? []).reduce(
    (sum: number, service: any) => sum + Number(service?.price ?? 0),
    0
  );

  return basePrice + servicesTotal;
};

const addLogo = async (doc: any) => {
  const img = new Image();
  img.src = "/images/logo.png";

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(img, 0, 0);

  const logoBase64 = canvas.toDataURL("image/png");

  const logoWidth = 68;
  const logoHeight = (img.height / img.width) * logoWidth;

  doc.addImage(logoBase64, "PNG", 10, 0, logoWidth, logoHeight);
};


export default function InvoicesPage() {
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: graves = [], isLoading: gravesLoading } = useGraves();

  const addInvoice = useAddInvoice();
  const deleteInvoice = useDeleteInvoice();

  const isLoading = invoicesLoading || gravesLoading;

  const gravesWithoutInvoice = graves.filter(
    (grave: any) =>
      !invoices.some((invoice: any) => invoice.grave_id === grave.id)
  );

  const getInvoiceGrave = (invoice: any) =>
    invoice.grave ??
    invoice.graves ??
    graves.find((grave: any) => grave.id === invoice.grave_id);

  const generateInvoice = (grave: any) => {
    addInvoice.mutate(
      {
        grave_id: grave.id,
        total_price: getGraveTotalPrice(grave),
      },
      {
        onSuccess: (invoice) =>
          toast({
            title: "Faktura vytvořena",
            description: invoice.invoice_number,
          }),
        onError: (e: any) =>
          toast({
            title: "Chyba",
            description: e.message,
            variant: "destructive",
          }),
      }
    );
  };

  const cancelInvoice = (invoice: any) => {
    if (!confirm(`Stornovat fakturu ${invoice.invoice_number}?`)) return;

    deleteInvoice.mutate(invoice.id, {
      onSuccess: () =>
        toast({
          title: "Faktura stornována",
          description: "Hrob se vrátil do seznamu hrobů bez faktury.",
        }),
      onError: (e: any) =>
        toast({
          title: "Chyba",
          description: e.message,
          variant: "destructive",
        }),
    });
  };

  const downloadPdf = async (invoice: any) => {
  const { default: jsPDF } = await import("jspdf");
  const qrcode = (await import("qrcode-generator")).default;

  const doc = new jsPDF();

  await registerPdfFonts(doc);

  doc.setFont("OpenSans", "bold");
  doc.setFont("OpenSans", "normal");
  await addLogo(doc);

  const grave = getInvoiceGrave(invoice);
  const client = getClient(grave);

  const invoiceNumber = invoice.invoice_number;
  const total = Number(invoice.total_price ?? getGraveTotalPrice(grave));

  const blue = [66, 136, 185] as const;
  const dark = [40, 40, 40] as const;

  const formatDate = (value: string) => {
    if (!value) return "—";
    const date = new Date(value);
    return date.toLocaleDateString("cs-CZ");
  };

  const sanitizeMessage = (msg: string) =>
    msg.replace(/[\r\n\t]/g, "").trim();

  const generateQRPlatba = (
    iban: string,
    amount: number,
    vs: string,
    msg: string
  ) => {
    return `SPD*1.0*ACC:${iban}*AM:${amount.toFixed(
      2
    )}*CC:CZK*X-VS:${vs}*MSG:${sanitizeMessage(msg)}`;
  };

  const supplier = {
    name: "Martinková Vendula",
    address: "Nové sady 988/2\n602 00 Brno",
    dph: "Neplátce DPH",
    phone: "+420 739 396 414",
    email: "udrzujemehroby@gmail.com",
    web: "www.udrzujeme-hroby.cz",
    account: "2902976001 / 2010",
    iban: "CZ5020100000002902976001",
  };

  // Horní modrý box
  doc.setFillColor(...blue);
  doc.rect(110, 12, 95, 15, "F");

  doc.setFont("OpenSans", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("Faktura č.", 125, 22);

  doc.setFont("OpenSans", "normal");
  doc.text(invoiceNumber, 160, 22);

  // Svislá modrá čára
  doc.setFillColor(...blue);
  doc.rect(110, 12, 1, 110, "F");

  // Dodavatel
  doc.setFont("OpenSans", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...blue);
  doc.text("DODAVATEL", 10, 50);

  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.text(supplier.name, 10, 60);

  doc.setFont("OpenSans", "normal");
  supplier.address.split("\n").forEach((line, index) => {
    doc.text(line, 10, 66 + index * 6);
  });

  doc.setFont("OpenSans", "bold");
  doc.text(supplier.dph, 10, 80);

  doc.setTextColor(...blue);
  doc.text("Kontaktní údaje:", 10, 92);

  doc.setFont("OpenSans", "normal");
  doc.setTextColor(...dark);
  doc.text(supplier.phone, 10, 100);
  doc.text(supplier.email, 10, 106);
  doc.text(supplier.web, 10, 112);

  // Odběratel
  doc.setFont("OpenSans", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...blue);
  doc.text("ODBĚRATEL", 120, 50);

  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.text(client?.full_name ?? getClientName(grave), 120, 60);

  doc.setFont("OpenSans", "normal");
  if (client?.phone) doc.text(client.phone, 120, 67);
  if (client?.email) doc.text(client.email, 120, 74);

  // Platební blok
  doc.setFillColor(...blue);
  doc.rect(5, 120, 200, 40, "F");

  doc.setFont("OpenSans", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("Platební údaje", 55, 130);

  doc.setFont("OpenSans", "normal");
  doc.text("Číslo účtu:", 55, 137);
  doc.setFont("OpenSans", "bold");
  doc.text(supplier.account, 90, 137);

  doc.setFont("OpenSans", "normal");
  doc.text("Variabilní symbol:", 55, 144);
  doc.setFont("OpenSans", "bold");
  doc.text(invoiceNumber, 90, 144);

  doc.setFont("OpenSans", "normal");
  doc.text("Forma úhrady:", 55, 151);
  doc.setFont("OpenSans", "bold");
  doc.text("Bankovním převodem", 90, 151);

  doc.setFont("OpenSans", "normal");
  doc.text("Datum vystavení:", 145, 137);
  doc.setFont("OpenSans", "bold");
  doc.text(formatDate(invoice.issue_date), 180, 137);

  doc.setFont("OpenSans", "normal");
  doc.text("Datum splatnosti:", 145, 144);
  doc.setFont("OpenSans", "bold");
  doc.text(formatDate(invoice.due_date), 180, 144);

  // Hlavička položek
  doc.setFont("OpenSans", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...dark);

  doc.text("Počet", 8, 180);
  doc.text("Popis", 27, 180);
  doc.text("Poznámka", 62, 180);
  doc.text("Jedn. cena", 157, 180);
  doc.text("Celkem", 182, 180);

  const rows = [
    {
      quantity: 1,
      description: "Úklidové práce",
      note: getGraveLabel(grave),
      unitPrice: Number(grave?.base_price ?? 0),
    },
    ...(grave?.additional_services ?? []).map((service: any) => ({
      quantity: 1,
      description: service.name || "Dodatečná služba",
      note: service.note || "",
      unitPrice: Number(service.price ?? 0),
    })),
  ];

  let calculatedTotal = 0;

  rows.forEach((row, index) => {
    const y = 186 + index * 6;
    const rowTotal = row.quantity * row.unitPrice;
    calculatedTotal += rowTotal;

    doc.setFillColor(220, 220, 220);
    doc.setDrawColor(255, 255, 255);
    doc.rect(5, y - 4.5, 200, 6, "FD");

    [25, 60, 155, 180].forEach((x) => {
      doc.line(x, y - 4.5, x, y + 1.5);
    });

    doc.setTextColor(...dark);
    doc.setFont("OpenSans", "normal");
    doc.setFontSize(10);

    doc.text(`${row.quantity} ks`, 8, y);
    doc.text(String(row.description).slice(0, 18), 27, y);
    doc.text(String(row.note).slice(0, 45), 62, y);
    doc.text(`${row.unitPrice.toLocaleString("cs-CZ")} Kč`, 157, y);
    doc.text(`${rowTotal.toLocaleString("cs-CZ")} Kč`, 182, y);
  });

  const finalTotal = total || calculatedTotal;
  const baseY = 186 + rows.length * 6 + 10;
  const boxY = baseY - 11;

  // Celkem k úhradě
  doc.setFillColor(...blue);
  doc.rect(110, boxY, 95, 15, "F");

  doc.setFont("OpenSans", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Celkem k úhradě: ${finalTotal.toLocaleString("cs-CZ")} Kč`,
    120,
    boxY + 10
  );

  // QR platba
  const qrData = generateQRPlatba(
    supplier.iban,
    finalTotal,
    invoiceNumber,
    `Faktura ${invoiceNumber}`
  );

  const qr = qrcode(0, "M");
  qr.addData(qrData);
  qr.make();

  const qrDataUrl = qr.createDataURL(6);

  doc.addImage(qrDataUrl, "PNG", 10, 123, 35, 35);

  doc.save(`faktura_${invoiceNumber}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-full md:max-w-[75%]">
      <div className="page-header">
        <h1 className="page-title">Faktury</h1>
        <p className="page-description">Vystavování a správa faktur</p>
      </div>

      {gravesWithoutInvoice.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Hroby bez faktury:</p>

            <div className="space-y-2">
              {gravesWithoutInvoice.map((grave: any) => (
                <div
                  key={grave.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm flex items-center gap-2 flex-wrap">
                    {getGraveLabel(grave)} — {getClientName(grave)}

                    <Badge
                      variant={getStatusVariant(grave.status)}
                      className="text-[10px] px-2 py-0"
                    >
                      {statusLabels[grave.status] || grave.status}
                    </Badge>
                  </span>

                  <Button
                    size="sm"
                    onClick={() => generateInvoice(grave)}
                    disabled={addInvoice.isPending}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Vytvořit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice: any) => {
            const grave = getInvoiceGrave(invoice);
            const client = getClient(grave);

            return (
              <Card key={invoice.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">
                        {invoice.invoice_number}
                      </CardTitle>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadPdf(invoice)}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        PDF
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => cancelInvoice(invoice)}
                        disabled={deleteInvoice.isPending}
                      >
                        Stornovat
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="text-sm space-y-1">
                  <p>
                    Klient:{" "}
                    <span className="font-medium">
                      {client?.full_name ?? getClientName(grave)}
                    </span>
                  </p>

                  <p>Hrob: {getGraveLabel(grave)}</p>

                  <div className="flex gap-4 flex-wrap">
                    <span>Vystaveno: {invoice.issue_date}</span>
                    <span>Splatnost: {invoice.due_date}</span>
                  </div>

                  <p className="font-semibold">
                    {formatCurrency(invoice.total_price)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && invoices.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Zatím žádné faktury. Vytvořte první fakturu z hrobu.</p>
        </div>
      )}
    </div>
  );
}