import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2, Pencil, Camera } from "lucide-react";
import { Grave } from "@/types/api";
import { useState } from "react";
import { useDeleteGrave, useUpdateGrave } from "@/hooks/useGraves";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";

const statusStyles: Record<string, string> = {
  plánováno: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900 transition-colors cursor-pointer",
  probíhá: "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 transition-colors cursor-pointer",
  dokončeno: "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 transition-colors cursor-pointer",
  zrušeno: "bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 transition-colors cursor-pointer",
};

const statusLabels: Record<string, string> = {
  plánováno: "Plánováno",
  probíhá: "Probíhá",
  dokončeno: "Dokončeno",
  zrušeno: "Zrušeno",
};

const statusOptions = [
  { value: "plánováno" as const, label: "Plánováno", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900 transition-colors cursor-pointer" },
  { value: "probíhá" as const, label: "Probíhá", color: "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 transition-colors cursor-pointer" },
  { value: "dokončeno" as const, label: "Dokončeno", color: "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 transition-colors cursor-pointer" },
  { value: "zrušeno" as const, label: "Zrušeno", color: "bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 transition-colors cursor-pointer" },
];

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
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { mutate: deleteGrave } = useDeleteGrave();
  const { mutate: updateGrave } = useUpdateGrave();
  
  const clientName = grave.clients?.full_name || "Neznámý klient";
  const cemeteryName = grave.cemetery_name || "Neznámý hřbitov";
  
  const handleStatusChange = (newStatus: string) => {
    setUpdatingStatus(true);
    updateGrave(
      { id: grave.id, status: newStatus },
      {
        onSuccess: () => {
          setShowStatusDropdown(false);
          toast({ title: "Status aktualizován" });
        },
        onError: (error) => {
          toast({ title: "Chyba při aktualizaci statusu", variant: "destructive" });
          console.error(error);
        },
        onSettled: () => {
          setUpdatingStatus(false);
        },
      }
    );
  };
  
  const currentStatus = grave.status || "plánováno";
  
  return (
    <Card className="mb-4">
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <CardTitle className="text-lg flex-shrink-0">{clientName}</CardTitle>
              <Popover open={showStatusDropdown} onOpenChange={setShowStatusDropdown}>
                <PopoverTrigger asChild>
                  <Badge 
                    className={statusStyles[currentStatus as keyof typeof statusStyles]}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {statusLabels[currentStatus as keyof typeof statusLabels]}
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                  <div className="grid gap-1">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(option.value);
                        }}
                        disabled={updatingStatus || currentStatus === option.value}
                        className={`px-4 py-2 text-left text-sm font-medium rounded transition-colors ${option.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
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
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Upravit"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
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
            <div className="text-slate-400">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <div className="border-t transition-all duration-300 ease-in-out overflow-hidden" 
        style={{
          maxHeight: isExpanded ? "2000px" : "0px",
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <CardContent className="pt-4 space-y-4">
          {/* Status change section */}
          <div className="pb-4 border-b border-slate-200">
            <span className="font-semibold text-sm block mb-2">Změnit stav:</span>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={updatingStatus || currentStatus === option.value}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${option.color} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

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
      </div>
    </Card>
  );
}
