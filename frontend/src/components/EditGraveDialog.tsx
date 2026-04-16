import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Client } from "@/hooks/useClients";
import { Graveyard } from "@/hooks/useGraveyards";
import { ReminderDateFields } from "./ReminderDateFields";
import { useBulkAddReminders } from "@/hooks/useReminders";

interface ReminderDate {
  id: string;
  date: string;
  isExisting?: boolean;
}

interface EditGraveDialogProps {
  grave: any | null;
  clients: Client[];
  graveyards: Graveyard[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
}

export function EditGraveDialog({ grave, clients, graveyards, open, onOpenChange, onSave }: EditGraveDialogProps) {
  const [form, setForm] = useState({
    client_id: "", graveyard_id: "", grave_number: "", latitude: "", longitude: "",
    name_on_grave: "", cleaning_frequency: "2x" as "1x" | "2x" | "4x" | "custom", base_price: "", notes: "",
  });
  const [reminderDates, setReminderDates] = useState<ReminderDate[]>([]);
  const bulkAddReminders = useBulkAddReminders();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Refetch graves data when dialog opens to get latest reminders
    const refetchGraves = async () => {
      if (grave && open) {
        try {
          await queryClient.refetchQueries({ queryKey: ["graves"] });
        } catch (error) {
          // Silently fail - will use fallback
        }
      }
    };
    refetchGraves();
  }, [grave, open, queryClient]);

  useEffect(() => {
    if (grave && open) {
      // Fetch fresh grave data from API to get latest reminders
      const fetchGraveData = async () => {
        try {
          const response = await fetch(`/api/graves/${grave.id}`, {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch grave: ${response.status}`);
          }
          
          const freshGraveData = await response.json();
          
          setForm({
            client_id: String(freshGraveData.client_id),
            graveyard_id: String(freshGraveData.graveyard_id),
            name_on_grave: freshGraveData.name_on_grave || "",
            grave_number: freshGraveData.grave_number,
            latitude: String(freshGraveData.latitude),
            longitude: String(freshGraveData.longitude),
            cleaning_frequency: freshGraveData.cleaning_frequency,
            base_price: String(freshGraveData.base_price),
            notes: freshGraveData.notes,
          });
          
          // Load existing reminders from fresh data
          if (freshGraveData.reminders && Array.isArray(freshGraveData.reminders)) {
            const loadedReminders: ReminderDate[] = freshGraveData.reminders
              .sort((a: any, b: any) => new Date(a.next_date).getTime() - new Date(b.next_date).getTime())
              .map((reminder: any) => ({
                id: `reminder-${reminder.id}`,
                date: reminder.next_date || "",
                isExisting: true,
              }));
            setReminderDates(loadedReminders);
          } else {
            setReminderDates([]);
          }
        } catch (error) {
          // Fallback to using the prop grave data if API fetch fails
          setForm({
            client_id: String(grave.client_id),
            graveyard_id: String(grave.graveyard_id),
            name_on_grave: grave.name_on_grave || "",
            grave_number: grave.grave_number,
            latitude: String(grave.latitude),
            longitude: String(grave.longitude),
            cleaning_frequency: grave.cleaning_frequency,
            base_price: String(grave.base_price),
            notes: grave.notes,
          });
          setReminderDates([]);
        }
      };
      
      fetchGraveData();
    }
  }, [grave, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.graveyard_id || !form.grave_number) {
      toast({ title: "Chyba", description: "Klient, hřbitov a číslo hrobu jsou povinné.", variant: "destructive" });
      return;
    }
    
    const graveData = {
      id: grave!.id, client_id: Number(form.client_id), graveyard_id: Number(form.graveyard_id), name_on_grave: form.name_on_grave || null, grave_number: form.grave_number,
      latitude: parseFloat(form.latitude) || 50.0755, longitude: parseFloat(form.longitude) || 14.4378,
      cleaning_frequency: form.cleaning_frequency, base_price: parseFloat(form.base_price) || 0, notes: form.notes,
    };

    onSave(graveData);

    // Odděluj nové a existující reminders
    const existingReminders = reminderDates.filter((r) => r.isExisting && r.date);
    const newReminders = reminderDates.filter((r) => r.date && !r.isExisting);
    
    let updateCount = 0;
    let createCount = 0;
    const errors: string[] = [];

    // Aktualizuj EXISTUJÍCÍ reminders (PATCH)
    for (const reminder of existingReminders) {
      if (reminder.id) {
        const reminderId = reminder.id.replace("reminder-", "");
        try {
          const response = await fetch(`/api/reminders/${reminderId}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ next_date: reminder.date }),
          });
          if (response.ok) {
            updateCount++;
          } else {
            errors.push(`Reminder ${reminderId}: ${response.status}`);
          }
        } catch (error: any) {
          errors.push(`Reminder ${reminderId}: ${error.message}`);
        }
      }
    }

    // Vytvoř NOVÉ reminders (POST via bulk-create)
    if (newReminders.length > 0) {
      try {
        const remindersToCreate = newReminders.map((r) => ({
          client_id: Number(form.client_id),
          grave_id: grave!.id,
          next_date: r.date,
          status: "upcoming" as const,
        }));

        const response = await fetch("/api/reminders/bulk-create", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reminders: remindersToCreate }),
        });

        if (response.ok) {
          createCount = newReminders.length;
        } else {
          errors.push(`Bulk create: ${response.status}`);
        }
      } catch (error: any) {
        errors.push(`Bulk create: ${error.message}`);
      }
    }

    // Zobraz výsledky a zavři dialog
    const totalUpdated = updateCount + createCount;
    const totalErrors = errors.length;
    
    if (totalErrors === 0 && totalUpdated > 0) {
      toast({ 
        title: "Úspěšně uloženo", 
        description: `Aktualizováno ${updateCount} reminders, přidáno ${createCount} nových` 
      });
    } else if (totalErrors === 0) {
      toast({ title: "Hrob upraven" });
    } else if (totalUpdated > 0) {
      toast({ 
        title: "Částečná úprava", 
        description: `Uloženo: ${totalUpdated}, Chyby: ${errors.join("; ")}`, 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Chyba", 
        description: `Chyby: ${errors.join("; ")}`, 
        variant: "destructive" 
      });
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Upravit hrob</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Klient *</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Vyberte klienta" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Hřbitov *</Label>
              <Select value={form.graveyard_id} onValueChange={(v) => setForm((f) => ({ ...f, graveyard_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Vyberte hřbitov" /></SelectTrigger>
                <SelectContent>{graveyards.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Jméno na hrobě</Label><Input value={form.name_on_grave} onChange={(e) => setForm((f) => ({ ...f, name_on_grave: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Číslo hrobu *</Label><Input value={form.grave_number} onChange={(e) => setForm((f) => ({ ...f, grave_number: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Zeměpisná šířka</Label><Input value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Zeměpisná délka</Label><Input value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Četnost</Label>
              <Select value={form.cleaning_frequency} onValueChange={(v: any) => setForm((f) => ({ ...f, cleaning_frequency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1x">1×/rok</SelectItem><SelectItem value="2x">2×/rok</SelectItem>
                  <SelectItem value="4x">4×/rok</SelectItem><SelectItem value="custom">Vlastní</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Základní cena (Kč)</Label><Input type="number" value={form.base_price} onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))} /></div>
          </div>

          <ReminderDateFields
            cleaningFrequency={form.cleaning_frequency}
            value={reminderDates}
            onChange={setReminderDates}
          />

          <div className="space-y-1"><Label>Poznámky</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Zrušit</Button>
            <Button type="submit" disabled={bulkAddReminders.isPending}>Uložit</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
