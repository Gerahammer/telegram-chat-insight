import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export interface TrackerField {
  name: string;
  type: "text" | "number" | "boolean" | "enum" | "date";
  options?: string[];
  required?: boolean;
}

export interface Tracker {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  fields: TrackerField[];
  isActive: boolean;
  _count?: { entries: number };
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes / No" },
  { value: "enum", label: "Options (pick one)" },
  { value: "date", label: "Date" },
];

const ICONS = ["📋", "🤝", "💰", "⚠️", "🎯", "📌", "🔔", "💡", "🚀", "👥", "📊", "🔑"];

function FieldRow({
  field, index, onChange, onRemove,
}: {
  field: TrackerField; index: number;
  onChange: (i: number, f: TrackerField) => void;
  onRemove: (i: number) => void;
}) {
  const [optionInput, setOptionInput] = useState("");

  return (
    <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          placeholder="Field name (e.g. Company)"
          value={field.name}
          onChange={e => onChange(index, { ...field, name: e.target.value })}
          className="h-8 text-sm"
        />
        <Select value={field.type} onValueChange={v => onChange(index, { ...field, type: v as TrackerField["type"], options: v === "enum" ? (field.options ?? []) : undefined })}>
          <SelectTrigger className="h-8 w-40 text-xs shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-muted-foreground">Required</span>
          <Switch checked={!!field.required} onCheckedChange={v => onChange(index, { ...field, required: v })} />
        </div>
        <button onClick={() => onRemove(index)} className="text-muted-foreground hover:text-destructive shrink-0">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {field.type === "enum" && (
        <div className="pl-6 space-y-1.5">
          <div className="flex flex-wrap gap-1">
            {(field.options ?? []).map((opt, oi) => (
              <Badge key={oi} variant="secondary" className="text-xs gap-1">
                {opt}
                <button onClick={() => onChange(index, { ...field, options: field.options?.filter((_, i) => i !== oi) })}>×</button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-1">
            <Input
              placeholder="Add option…"
              value={optionInput}
              onChange={e => setOptionInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && optionInput.trim()) {
                  onChange(index, { ...field, options: [...(field.options ?? []), optionInput.trim()] });
                  setOptionInput("");
                }
              }}
              className="h-7 text-xs"
            />
            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => {
              if (optionInput.trim()) {
                onChange(index, { ...field, options: [...(field.options ?? []), optionInput.trim()] });
                setOptionInput("");
              }
            }}>Add</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TrackerForm({
  initial, onSave, onCancel,
}: {
  initial?: Partial<Tracker>;
  onSave: (t: Tracker) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "📋");
  const [fields, setFields] = useState<TrackerField[]>(initial?.fields ?? [{ name: "", type: "text", required: true }]);
  const [saving, setSaving] = useState(false);

  const updateField = (i: number, f: TrackerField) => setFields(prev => prev.map((x, idx) => idx === i ? f : x));
  const removeField = (i: number) => setFields(prev => prev.filter((_, idx) => idx !== i));
  const addField = () => setFields(prev => [...prev, { name: "", type: "text", required: false }]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Tracker name is required"); return; }
    if (fields.length === 0) { toast.error("Add at least one field"); return; }
    if (fields.some(f => !f.name.trim())) { toast.error("All fields need a name"); return; }
    if (fields.some(f => f.type === "enum" && (!f.options || f.options.length < 2))) {
      toast.error("Enum fields need at least 2 options"); return;
    }
    setSaving(true);
    try {
      const method = initial?.id ? "PUT" : "POST";
      const url = initial?.id ? `/api/trackers/${initial.id}` : "/api/trackers";
      const res = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), description, icon, fields }) });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      toast.success(initial?.id ? "Tracker updated" : "Tracker created");
      onSave(data.tracker);
    } catch {
      toast.error("Failed to save tracker");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-primary/30 rounded-xl p-4 space-y-4 bg-primary/5">
      <div className="flex items-center gap-3">
        <Select value={icon} onValueChange={setIcon}>
          <SelectTrigger className="w-16 h-9 text-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ICONS.map(ic => <SelectItem key={ic} value={ic}>{ic}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Tracker name (e.g. Deals)" value={name} onChange={e => setName(e.target.value)} className="h-9" />
        <Input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} className="h-9" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Fields</Label>
        {fields.map((f, i) => (
          <FieldRow key={i} field={f} index={i} onChange={updateField} onRemove={removeField} />
        ))}
        <button onClick={addField} className="flex items-center gap-1 text-xs text-primary hover:underline">
          <Plus className="h-3 w-3" /> Add field
        </button>
      </div>

      <div className="flex gap-2 pt-1">
        <Button className="gradient-primary border-0 h-8 text-sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : initial?.id ? "Update tracker" : "Create tracker"}
        </Button>
        <Button variant="ghost" className="h-8 text-sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function TrackerBuilderTab() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetch("/api/trackers").catch(() => null);
    if (res?.ok) { const d = await res.json(); setTrackers(d.trackers ?? []); }
    setLoaded(true);
  };

  if (!loaded) { load(); return <div className="text-sm text-muted-foreground py-4">Loading…</div>; }

  const handleSaved = (tracker: Tracker) => {
    setTrackers(prev => {
      const idx = prev.findIndex(t => t.id === tracker.id);
      return idx >= 0 ? prev.map(t => t.id === tracker.id ? tracker : t) : [...prev, tracker];
    });
    setCreating(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tracker and all its entries?")) return;
    const res = await apiFetch(`/api/trackers/${id}`, { method: "DELETE" });
    if (res.ok) { setTrackers(prev => prev.filter(t => t.id !== id)); toast.success("Tracker deleted"); }
    else toast.error("Failed to delete");
  };

  const handleToggle = async (tracker: Tracker) => {
    const res = await apiFetch(`/api/trackers/${tracker.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !tracker.isActive }),
    });
    if (res.ok) {
      const d = await res.json();
      setTrackers(prev => prev.map(t => t.id === tracker.id ? d.tracker : t));
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Tell the AI what to track. Every daily summary will automatically extract matching entries from your chats.</p>
        </div>
        {!creating && (
          <Button className="gradient-primary border-0 h-8 text-sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" /> New tracker
          </Button>
        )}
      </div>

      {creating && <TrackerForm onSave={handleSaved} onCancel={() => setCreating(false)} />}

      {trackers.length === 0 && !creating && (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-sm">No trackers yet. Create one to start extracting structured data from your chats.</p>
        </div>
      )}

      {trackers.map(tracker => (
        <div key={tracker.id}>
          {editingId === tracker.id ? (
            <TrackerForm initial={tracker} onSave={handleSaved} onCancel={() => setEditingId(null)} />
          ) : (
            <div className={`border rounded-xl p-4 space-y-2 transition ${tracker.isActive ? "border-border" : "border-border/50 opacity-60"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{tracker.icon ?? "📋"}</span>
                  <div>
                    <p className="font-medium text-sm">{tracker.name}</p>
                    {tracker.description && <p className="text-xs text-muted-foreground">{tracker.description}</p>}
                  </div>
                  {tracker._count && <Badge variant="secondary" className="text-xs">{tracker._count.entries} entries</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={tracker.isActive} onCheckedChange={() => handleToggle(tracker)} />
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditingId(tracker.id)}>Edit</Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => handleDelete(tracker.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 pl-8">
                {tracker.fields.map((f, i) => (
                  <Badge key={i} variant="outline" className="text-xs gap-1">
                    {f.name}
                    <span className="text-muted-foreground">{f.type === "enum" ? `(${f.options?.join(" / ")})` : f.type}</span>
                    {f.required && <span className="text-primary">*</span>}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
