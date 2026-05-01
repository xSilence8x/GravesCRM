import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2, Pencil, Upload, X, Calendar } from "lucide-react";
import { Grave } from "@/types/api";
import { useState, useRef } from "react";
import {
  useDeleteGrave,
  useUpdateGrave,
  useInitCleanings,
  useUploadCleaningPhoto,
  useUpdateCleaning,
  useDeleteCleaningPhoto,
} from "@/hooks/useGraves";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [expandedCleaning, setExpandedCleaning] = useState<number | null>(
    grave.cleanings && grave.cleanings.length > 0 ? grave.cleanings[0].id : null
  );
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadCleaningId, setUploadCleaningId] = useState<number | null>(null);
  const [selectedPhotoType, setSelectedPhotoType] = useState<"před" | "po">("před");
  const [uploadNote, setUploadNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [dateEditingId, setDateEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: deleteGrave } = useDeleteGrave();
  const { mutate: updateGrave } = useUpdateGrave();
  const initCleanings = useInitCleanings();
  const uploadCleaningPhoto = useUploadCleaningPhoto();
  const updateCleaning = useUpdateCleaning();
  const deleteCleaningPhoto = useDeleteCleaningPhoto();

  const clientName = grave.clients?.full_name || "Neznámý klient";
  const cemeteryName = grave.cemetery_name || "Neznámý hřbitov";
  const currentStatus = grave.status || "plánováno";

  const handleStatusChange = (newStatus: string) => {
    setUpdatingStatus(true);
    updateGrave(
      { id: grave.id, status: newStatus },
      {
        onSuccess: () => {
          setShowStatusDropdown(false);
          toast({ title: "Status aktualizován" });
        },
        onError: () => {
          toast({ title: "Chyba při aktualizaci statusu", variant: "destructive" });
        },
        onSettled: () => {
          setUpdatingStatus(false);
        },
      }
    );
  };

  const handleInitCleanings = () => {
    initCleanings.mutate(grave.id, {
      onSuccess: () => {
        toast({ title: "Úklidy vytvořeny" });
      },
      onError: () => {
        toast({ title: "Chyba při vytváření úklidů", variant: "destructive" });
      },
    });
  };

  const handlePhotoUpload = () => {
    if (!selectedFile || !uploadCleaningId) {
      toast({ title: "Chyba", description: "Vyberte soubor a úklid", variant: "destructive" });
      return;
    }

    uploadCleaningPhoto.mutate(
      {
        cleaningId: uploadCleaningId,
        file: selectedFile,
        photo_type: selectedPhotoType,
        note: uploadNote,
      },
      {
        onSuccess: () => {
          toast({ title: "Fotografie nahrána" });
          setUploadDialogOpen(false);
          setSelectedFile(null);
          setUploadNote("");
          setSelectedPhotoType("před");
          setUploadCleaningId(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        },
        onError: () => {
          toast({ title: "Chyba při nahrávání fotografie", variant: "destructive" });
        },
      }
    );
  };

  const handleDeletePhoto = (cleaningId: number, photoId: number) => {
    if (confirm("Smazat tuto fotografii?")) {
      deleteCleaningPhoto.mutate(
        { cleaningId, photoId },
        {
          onSuccess: () => {
            toast({ title: "Fotografie smazána" });
          },
          onError: () => {
            toast({ title: "Chyba při mazání fotografie", variant: "destructive" });
          },
        }
      );
    }
  };

  const handleSaveDate = (cleaningId: number) => {
    updateCleaning.mutate(
      { cleaningId, performed_date: editDate || null },
      {
        onSuccess: () => {
          toast({ title: "Datum uloženo" });
          setDateEditingId(null);
          setEditDate("");
        },
        onError: () => {
          toast({ title: "Chyba při ukládání data", variant: "destructive" });
        },
      }
    );
  };

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
              <p>
                {cemeteryName} - Hrob č. {grave.grave_number}
              </p>
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
                  deleteGrave(grave.id);
                  if (onDeleteSuccess) onDeleteSuccess();
                }
              }}
              title="Smazat"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <div className="text-slate-400">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </CardHeader>

      <div
        className="border-t transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          maxHeight: isExpanded ? "3000px" : "0px",
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <CardContent className="pt-4 space-y-4">
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
          </div>

          {grave.notes && (
            <div>
              <span className="font-semibold text-sm">Poznámky:</span>
              <p className="text-sm text-muted-foreground">{grave.notes}</p>
            </div>
          )}

          {/* Additional services */}
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

          {/* Cleanings section */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Úklidy ({grave.cleanings?.length || 0}):</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleInitCleanings()}
                disabled={initCleanings.isPending || (grave.cleanings?.length || 0) > 0}
              >
                Inicializovat
              </Button>
            </div>

            {grave.cleanings && grave.cleanings.length > 0 ? (
              <div className="space-y-2">
                {grave.cleanings.map((cleaning) => (
                  <div key={cleaning.id} className="border rounded-lg p-3 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-sm">Úklid {cleaning.cleaning_number}</h5>
                      <button
                        onClick={() => setExpandedCleaning(expandedCleaning === cleaning.id ? null : cleaning.id)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {expandedCleaning === cleaning.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Date section */}
                    <div className="mb-2 text-sm">
                      {dateEditingId === cleaning.id ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="h-8 text-sm"
                          />
                          <Button size="sm" onClick={() => handleSaveDate(cleaning.id)}>
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDateEditingId(null);
                              setEditDate("");
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600">
                            {cleaning.performed_date ? cleaning.performed_date : "Bez data"}
                          </span>
                          <button
                            onClick={() => {
                              setDateEditingId(cleaning.id);
                              setEditDate(cleaning.performed_date || "");
                            }}
                            className="text-blue-600 hover:text-blue-700 text-xs ml-auto"
                          >
                            Upravit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Photos */}
                    {expandedCleaning === cleaning.id && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Fotografie ({cleaning.photos?.length || 0}):</span>
                          <Dialog open={uploadDialogOpen && uploadCleaningId === cleaning.id} onOpenChange={setUploadDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setUploadCleaningId(cleaning.id)}
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                Nahrát
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Nahrát fotografii - Úklid {cleaning.cleaning_number}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Typ fotografie</Label>
                                  <div className="flex gap-2">
                                    <Button
                                      variant={selectedPhotoType === "před" ? "default" : "outline"}
                                      onClick={() => setSelectedPhotoType("před")}
                                      className="flex-1"
                                    >
                                      Před úklidem
                                    </Button>
                                    <Button
                                      variant={selectedPhotoType === "po" ? "default" : "outline"}
                                      onClick={() => setSelectedPhotoType("po")}
                                      className="flex-1"
                                    >
                                      Po úklidu
                                    </Button>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="photo-file">Vyberte soubor</Label>
                                  <Input
                                    ref={fileInputRef}
                                    id="photo-file"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="photo-note">Poznámka (volitelné)</Label>
                                  <Input
                                    id="photo-note"
                                    placeholder="Např. Pravá strana, Detail..."
                                    value={uploadNote}
                                    onChange={(e) => setUploadNote(e.target.value)}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                                    Zrušit
                                  </Button>
                                  <Button
                                    onClick={handlePhotoUpload}
                                    disabled={!selectedFile || uploadCleaningPhoto.isPending}
                                  >
                                    {uploadCleaningPhoto.isPending ? "Nahrávám..." : "Nahrát"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {cleaning.photos && cleaning.photos.length > 0 ? (
                          <div className="grid grid-cols-4 gap-2">
                            {cleaning.photos.map((photo) => (
                              <div
                                key={photo.id}
                                className="relative group cursor-pointer"
                                onClick={() => {
                                  setSelectedPhoto(photo);
                                  setLightboxOpen(true);
                                }}
                              >
                                <img
                                  src={photo.url}
                                  alt={`${photo.type} fotografie`}
                                  className="w-full h-20 object-cover rounded border border-gray-200 hover:opacity-80 transition-opacity"
                                />
                                <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-2 py-1 rounded">
                                  {photo.type}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePhoto(cleaning.id, photo.id);
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                  title="Smazat fotografii"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Žádné fotografie</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Žádné úklidy. Klikněte na "Inicializovat".</p>
            )}
          </div>

          {/* Reminders section */}
          {grave.reminders && grave.reminders.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold text-sm">Připomínky ({grave.reminders.length}):</h4>
              <div className="space-y-2">
                {grave.reminders.map((reminder) => {
                  const normalizedStatus = reminder.status === "nadcházející" ? "upcoming" : reminder.status === "brzy" ? "due-soon" : reminder.status === "po termínu" ? "overdue" : "upcoming";
                  
                  const reminderBg = {
                    upcoming: "bg-blue-50 border-blue-200",
                    "due-soon": "bg-yellow-50 border-yellow-200",
                    overdue: "bg-red-50 border-red-200",
                  }[normalizedStatus] || "bg-gray-50 border-gray-200";

                  const reminderBadge = {
                    upcoming: "bg-blue-100 text-blue-800",
                    "due-soon": "bg-yellow-100 text-yellow-800",
                    overdue: "bg-red-100 text-red-800",
                  }[normalizedStatus] || "bg-gray-100 text-gray-800";

                  return (
                    <div key={reminder.id} className={`border rounded p-2 text-sm ${reminderBg}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {reminder.cleaning_sequence && reminder.cleaning_total
                              ? `Úklid ${reminder.cleaning_sequence}/${reminder.cleaning_total}`
                              : "Připomínka"}
                          </p>
                          {reminder.next_date && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(reminder.next_date).toLocaleDateString("cs-CZ")}
                            </p>
                          )}
                        </div>
                        <Badge className={reminderBadge}>{reminder.status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lightbox for full-size photo view */}
          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className="max-w-4xl w-full max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  {selectedPhoto?.type === "před" ? "Fotografie před úklidem" : "Fotografie po úklidu"}
                  {selectedPhoto?.note && ` - ${selectedPhoto.note}`}
                </DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-center bg-black/5 rounded">
                <img
                  src={selectedPhoto?.url}
                  alt={`${selectedPhoto?.type} fotografie`}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </div>
    </Card>
  );
}
