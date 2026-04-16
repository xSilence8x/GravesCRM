import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2, Pencil, Camera } from "lucide-react";
import { Grave } from "@/types/api";
import { useState } from "react";
import { useDeleteGrave } from "@/hooks/useGraves";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  plánováno: "bg-blue-100 text-blue-800",
  probíhá: "bg-yellow-100 text-yellow-800",
  dokončeno: "bg-green-100 text-green-800",
  zrušeno: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  plánováno: "Plánováno",
  probíhá: "Probíhá",
  dokončeno: "Dokončeno",
  zrušeno: "Zrušeno",
};

interface GraveCardProps {
  grave: Grave;
  onEdit: () => void;
  onDeleteSuccess?: () => void;
}

export default function GraveCard({
  grave,
  onEdit,
  onDeleteSuccess,
}: GraveCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { mutate: deleteGrave } = useDeleteGrave();
  
  const clientName = grave.clients?.full_name || "Neznámý klient";
  const cemeteryName = grave.cemetery_name || "Neznámý hřbitov";
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{clientName}</CardTitle>
              <Badge className={statusStyles[grave.status as keyof typeof statusStyles]}>
                {statusLabels[grave.status as keyof typeof statusLabels]}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>{cemeteryName} - Hrob č. {grave.grave_number}</p>
              {grave.name_on_grave && <p className="text-xs">Jméno na hrobu: {grave.name_on_grave}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              title="Upravit"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Smazat tento hrob a všechny související data?")) {
                  deleteGrave(grave.id, {
                    onSuccess: () => {
                      if (onDeleteSuccess) onDeleteSuccess();
                    },
                  });
                }
              }}
              title="Smazat"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4 border-t space-y-4">
          {/* Details section */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Frekvence úklidu:</span>
              <p className="text-muted-foreground">
                {grave.cleaning_frequency === "vlastní" 
                  ? `Vlastní (${grave.custom_frequency_months} měsíců)`
                  : grave.cleaning_frequency}
              </p>
            </div>
            <div>
              <span className="font-semibold">Základní cena:</span>
              <p className="text-muted-foreground">{grave.base_price} Kč</p>
            </div>
            {grave.completion_date && (
              <div>
                <span className="font-semibold">Datum dokončení:</span>
                <p className="text-muted-foreground">{grave.completion_date}</p>
              </div>
            )}
          </div>

          {grave.notes && (
            <div>
              <span className="font-semibold text-sm">Poznámky:</span>
              <p className="text-sm text-muted-foreground">{grave.notes}</p>
            </div>
          )}

          {/* Services section */}
          {grave.additional_services && grave.additional_services.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Dodatečné služby:</h4>
              <ul className="space-y-2">
                {grave.additional_services.map((service) => (
                  <li key={service.id} className="text-sm flex justify-between items-start border-l-2 border-blue-300 pl-3">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.note && <p className="text-xs text-muted-foreground">{service.note}</p>}
                    </div>
                    <span className="font-semibold text-blue-600">{service.price} Kč</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Photos section */}
          {grave.photos && grave.photos.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Fotografie ({grave.photos.length}):</h4>
              <div className="grid grid-cols-4 gap-2">
                {grave.photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={`${photo.type} fotografie`}
                      className="w-full h-20 object-cover rounded border border-gray-200"
                    />
                    <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-2 py-1 rounded">
                      {photo.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reminders section */}
          {grave.reminders && grave.reminders.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Připomenutí ({grave.reminders.length}):</h4>
              <ul className="space-y-1 text-sm">
                {grave.reminders.map((reminder) => (
                  <li key={reminder.id} className="flex justify-between items-center">
                    <span>{reminder.next_date}</span>
                    <Badge variant="secondary">{reminder.status}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
