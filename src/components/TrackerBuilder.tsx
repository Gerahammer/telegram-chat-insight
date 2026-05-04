import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, Loader2, Sparkles, Wrench } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// ─── Preset templates ─────────────────────────────────────────────────────────

interface TrackerTemplate {
  name: string;
  icon: string;
  description: string;
  fields: TrackerField[];
}

const TEMPLATES: TrackerTemplate[] = [
  {
    name: "Deals",
    icon: "💰",
    description: "Sales opportunities discussed with customers",
    fields: [
      { name: "Customer", type: "text", required: true },
      { name: "Company", type: "text", required: false },
      { name: "Amount", type: "number", required: false },
      { name: "Stage", type: "enum", options: ["Lead", "Qualified", "Proposal", "Closed-won", "Closed-lost"], required: false },
      { name: "Owner", type: "text", required: false },
    ],
  },
  {
    name: "Support tickets",
    icon: "🎫",
    description: "Customer issues and their status",
    fields: [
      { name: "Customer", type: "text", required: true },
      { name: "Issue", type: "text", required: true },
      { name: "Priority", type: "enum", options: ["Low", "Medium", "High", "Urgent"], required: false },
      { name: "Status", type: "enum", options: ["Open", "In Progress", "Waiting", "Resolved"], required: false },
      { name: "Assignee", type: "text", required: false },
    ],
  },
  {
    name: "Leads",
    icon: "🤝",
    description: "Prospective customers in the funnel",
    fields: [
      { name: "Name", type: "text", required: true },
      { name: "Company", type: "text", required: false },
      { name: "Source", type: "text", required: false },
      { name: "Stage", type: "enum", options: ["New", "Contacted", "Qualified", "Disqualified"], required: false },
      { name: "Notes", type: "text", required: false },
    ],
  },
  {
    name: "Candidates",
    icon: "👥",
    description: "Job applicants and their hiring stage",
    fields: [
      { name: "Name", type: "text", required: true },
      { name: "Role", type: "text", required: false },
      { name: "Stage", type: "enum", options: ["Applied", "Screen", "Interview", "Offer", "Hired", "Rejected"], required: false },
      { name: "Skills", type: "text", required: false },
    ],
  },
  {
    name: "Orders",
    icon: "📦",
    description: "Customer orders and fulfilment status",
    fields: [
      { name: "Customer", type: "text", required: true },
      { name: "Product", type: "text", required: false },
      { name: "Quantity", type: "number", required: false },
      { name: "Status", type: "enum", options: ["Placed", "Paid", "Shipped", "Delivered", "Cancelled"], required: false },
      { name: "Date", type: "date", required: false },
    ],
  },
  {
    name: "Bugs",
    icon: "🐛",
    description: "Bug reports surfacing in chat",
    fields: [
      { name: "Title", type: "text", required: true },
      { name: "Severity", type: "enum", options: ["Low", "Medium", "High", "Critical"], required: false },
      { name: "Reporter", type: "text", required: false },
      { name: "Status", type: "enum", options: ["New", "Confirmed", "Fixed", "Wontfix"], required: false },
    ],
  },
];

export interface TrackerField {
  name: string;
  type: "text" | "number" | "boolean" | "enum" | "date";
  options?: string[];
  required?: boolean;
  description?: string;
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

      {/* Hint to AI — disambiguates ambiguous field names like "User" or "Company". */}
      <div className="pl-6">
        <Input
          placeholder="Hint to the AI (optional) — e.g. 'the 3-digit code at the start of the message'"
          value={field.description ?? ""}
          onChange={e => onChange(index, { ...field, description: e.target.value })}
          className="h-7 text-xs"
        />
      </div>
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

type CreationStep =
  | { kind: 'closed' }
  | { kind: 'choose' }                                    // template / AI / scratch chooser
  | { kind: 'ai' }                                         // describe-it text input
  | { kind: 'editing'; initial?: Partial<Tracker> };       // TrackerForm with optional preset

export function TrackerBuilderTab() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creation, setCreation] = useState<CreationStep>({ kind: 'closed' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiDescription, setAiDescription] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

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
    setCreation({ kind: 'closed' });
    setEditingId(null);
  };

  const generateFromAI = async () => {
    if (!aiDescription.trim() || aiDescription.trim().length < 5) {
      toast.error("Describe what you want to track in a sentence or two.");
      return;
    }
    setAiGenerating(true);
    try {
      const res = await apiFetch("/api/trackers/generate", {
        method: "POST",
        body: JSON.stringify({ description: aiDescription.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "AI generation failed");
      // Drop into the editing form pre-populated; user reviews and clicks save.
      setCreation({ kind: 'editing', initial: data.tracker });
      setAiDescription("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiGenerating(false);
    }
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
        {creation.kind === 'closed' && (
          <Button className="gradient-primary border-0 h-8 text-sm" onClick={() => setCreation({ kind: 'choose' })}>
            <Plus className="h-4 w-4 mr-1" /> New tracker
          </Button>
        )}
      </div>

      {/* Chooser: template / AI / scratch */}
      {creation.kind === 'choose' && (
        <div className="border border-primary/30 rounded-xl p-4 space-y-4 bg-primary/5">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">How do you want to start?</p>
            <Button variant="ghost" size="sm" className="h-7" onClick={() => setCreation({ kind: 'closed' })}>Cancel</Button>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Pick a template</p>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.name}
                  className="text-left p-3 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition"
                  onClick={() => setCreation({ kind: 'editing', initial: { name: t.name, icon: t.icon, description: t.description, fields: t.fields } })}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{t.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-3 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1 h-8 text-sm" onClick={() => setCreation({ kind: 'ai' })}>
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Describe in plain English
            </Button>
            <Button variant="outline" className="flex-1 h-8 text-sm" onClick={() => setCreation({ kind: 'editing' })}>
              <Wrench className="h-3.5 w-3.5 mr-1" /> Build from scratch
            </Button>
          </div>
        </div>
      )}

      {/* AI describe-it text input */}
      {creation.kind === 'ai' && (
        <div className="border border-primary/30 rounded-xl p-4 space-y-3 bg-primary/5">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Describe what you want to track
            </p>
            <Button variant="ghost" size="sm" className="h-7" onClick={() => setCreation({ kind: 'choose' })}>Back</Button>
          </div>
          <textarea
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
            placeholder="e.g. I want to track sales deals between us and customers — I care about company, amount, who owns it, and current stage."
            rows={4}
            className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={aiGenerating}
          />
          <div className="flex gap-2">
            <Button onClick={generateFromAI} disabled={aiGenerating || !aiDescription.trim()} className="gradient-primary border-0 h-8 text-sm">
              {aiGenerating ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Generating…</> : <><Sparkles className="h-3.5 w-3.5 mr-1" /> Generate tracker</>}
            </Button>
            <Button variant="ghost" className="h-8 text-sm" onClick={() => { setAiDescription(""); setCreation({ kind: 'choose' }); }} disabled={aiGenerating}>Cancel</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The AI will draft a tracker schema from your description. You can review and tweak everything before saving.
          </p>
        </div>
      )}

      {/* TrackerForm — used for both new (with optional initial prefill) and editing */}
      {creation.kind === 'editing' && (
        <TrackerForm initial={creation.initial} onSave={handleSaved} onCancel={() => setCreation({ kind: 'closed' })} />
      )}

      {trackers.length === 0 && creation.kind === 'closed' && (
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
