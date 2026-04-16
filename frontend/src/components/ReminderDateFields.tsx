import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface ReminderDate {
  id: string;
  date: string;
}

interface ReminderDateFieldsProps {
  cleaningFrequency: "1x" | "2x" | "4x" | "custom";
  value: ReminderDate[];
  onChange: (dates: ReminderDate[]) => void;
}

const FREQUENCY_COUNT: Record<string, number> = {
  "1x": 1,
  "2x": 2,
  "4x": 4,
};

export function ReminderDateFields({
  cleaningFrequency,
  value,
  onChange,
}: ReminderDateFieldsProps) {
  const [dates, setDates] = useState<ReminderDate[]>(value);
  const requiredCount = FREQUENCY_COUNT[cleaningFrequency] || 0;

  // Synchronizuj se s parentem a frequency
  useEffect(() => {
    if (cleaningFrequency !== "custom") {
      const newCount = FREQUENCY_COUNT[cleaningFrequency] || 0;
      const updatedDates = [...value];

      // Doplň prázdné řádky
      while (updatedDates.length < newCount) {
        updatedDates.push({
          id: `${Date.now()}-${Math.random()}`,
          date: "",
        });
      }

      // Odstraň nadbytečné řádky
      if (updatedDates.length > newCount) {
        updatedDates.splice(newCount);
      }

      setDates(updatedDates);
      onChange(updatedDates);
    } else {
      setDates(value);
    }
  }, [value, cleaningFrequency]);

  const handleDateChange = (id: string, newDate: string) => {
    const updated = dates.map((d) => (d.id === id ? { ...d, date: newDate } : d));
    setDates(updated);
    onChange(updated);
  };

  const handleAdd = () => {
    const newDate: ReminderDate = {
      id: `${Date.now()}-${Math.random()}`,
      date: "",
    };
    const updated = [...dates, newDate];
    setDates(updated);
    onChange(updated);
  };

  const handleRemove = (id: string) => {
    // Pokud to není custom, minimální počet je určen frekvencí
    if (cleaningFrequency !== "custom" && dates.length <= requiredCount) {
      return;
    }
    const updated = dates.filter((d) => d.id !== id);
    setDates(updated);
    onChange(updated);
  };

  const getHeading = () => {
    const labels: Record<string, string> = {
      "1x": "Datum údržby (1x ročně)",
      "2x": "Datums údržby (2x ročně)",
      "4x": "Datums údržby (4x ročně)",
      custom: "Datums údržby (vlastní)",
    };
    return labels[cleaningFrequency] || "Datums údržby";
  };

  if (cleaningFrequency === "1x" || cleaningFrequency === "2x" || cleaningFrequency === "4x" || cleaningFrequency === "custom") {
    return (
      <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{getHeading()}</Label>
          {cleaningFrequency === "custom" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdd}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {dates.map((reminder, index) => (
            <div key={reminder.id} className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor={`reminder-${reminder.id}`} className="text-xs text-muted-foreground">
                  Datum {index + 1}
                </Label>
                <Input
                  id={`reminder-${reminder.id}`}
                  type="date"
                  value={reminder.date}
                  onChange={(e) => handleDateChange(reminder.id, e.target.value)}
                  className="h-8"
                />
              </div>
              {(cleaningFrequency === "custom" || dates.length > requiredCount) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(reminder.id)}
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  disabled={
                    cleaningFrequency !== "custom" && dates.length <= requiredCount
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {cleaningFrequency === "custom"
            ? "Klikněte na + pro přidání dalšího data"
            : `${requiredCount} datů údržby ročně`}
        </p>
      </div>
    );
  }

  return null;
}
