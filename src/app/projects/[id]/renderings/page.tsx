"use client";
import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Download, Loader2, Image } from "lucide-react";
import {
  INTERIOR_STYLES, ROOM_TYPES, FLOORING_OPTIONS, WALL_COLORS, CABINET_FINISHES
} from "@/lib/rendering-prompt";

interface FloorPlan { id: string; name: string; }
interface Rendering { id: string; name: string; filePath: string; style: string; roomType: string; createdAt: string; }

export default function RenderingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [renderings, setRenderings] = useState<Rendering[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    floorPlanId: "",
    style: "Modern Farmhouse",
    roomType: "kitchen",
    flooring: "hardwood",
    wallColor: "white",
    cabinetFinish: "white shaker",
    notes: "",
  });

  useEffect(() => {
    fetch(`/api/projects/${id}/renderings`).then(r => r.json()).then(setRenderings);
    fetch(`/api/projects/${id}/floor-plans`).then(r => r.json()).then(setFloorPlans);
  }, [id]);

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function generate() {
    setGenerating(true);
    setError("");
    const res = await fetch(`/api/projects/${id}/renderings/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const text = await res.text();
      let msg = "Generation failed";
      try { msg = JSON.parse(text).error || msg; } catch { msg = text || `Server error ${res.status}`; }
      setError(msg);
    } else {
      const r = await res.json();
      setRenderings(prev => [r, ...prev]);
    }
    setGenerating(false);
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <h1 className="text-xl font-bold">AI Renderings</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Generate Interior Rendering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Room Type</Label>
              <Select value={form.roomType} onValueChange={v => setField("roomType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Design Style</Label>
              <Select value={form.style} onValueChange={v => setField("style", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERIOR_STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Flooring</Label>
              <Select value={form.flooring} onValueChange={v => setField("flooring", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FLOORING_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Wall Color</Label>
              <Select value={form.wallColor} onValueChange={v => setField("wallColor", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WALL_COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {(form.roomType === "kitchen" || form.roomType === "bathroom") && (
              <div className="space-y-1">
                <Label>Cabinet Finish</Label>
                <Select value={form.cabinetFinish} onValueChange={v => setField("cabinetFinish", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CABINET_FINISHES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {floorPlans.length > 0 && (
              <div className="space-y-1">
                <Label>Floor Plan (optional)</Label>
                <Select value={form.floorPlanId} onValueChange={v => setField("floorPlanId", v)}>
                  <SelectTrigger><SelectValue placeholder="No floor plan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {floorPlans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label>Site Notes / Additional Context</Label>
            <Textarea
              placeholder="e.g. Client wants an open concept feel, existing brick fireplace to remain..."
              value={form.notes}
              onChange={e => setField("notes", e.target.value)}
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
          <Button onClick={generate} disabled={generating}>
            {generating
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating with Gemini...</>
              : <><Sparkles className="h-4 w-4 mr-2" /> Generate Rendering</>
            }
          </Button>
        </CardContent>
      </Card>

      {renderings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderings.map(r => (
            <Card key={r.id} className="overflow-hidden">
              <div className="aspect-video bg-[var(--muted)] relative">
                <img src={r.filePath} alt={r.name} className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="secondary">{r.style}</Badge>
                  </div>
                </div>
                <a href={r.filePath} download className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
                  <Download className="h-3 w-3" /> Download
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[var(--muted-foreground)]">
          <Image className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No renderings yet. Generate your first one above.</p>
        </div>
      )}
    </div>
  );
}
