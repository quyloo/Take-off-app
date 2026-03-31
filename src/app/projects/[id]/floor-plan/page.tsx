"use client";
import { useState, useEffect, use } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Home, Loader2 } from "lucide-react";

const FloorPlanEditor = dynamic(
  () => import("@/components/floor-plan/FloorPlanEditor").then(m => m.FloorPlanEditor),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-[var(--muted-foreground)]"><Loader2 className="h-6 w-6 animate-spin" /></div> }
);

interface ScanFile { id: string; originalName: string; fileType: string; source: string; }
interface FloorPlan { id: string; name: string; svgContent: string; version: number; createdAt: string; sourceType: string; widthFt?: number; heightFt?: number; }

export default function FloorPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scans, setScans] = useState<ScanFile[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [activePlan, setActivePlan] = useState<FloorPlan | null>(null);
  const [selectedScanId, setSelectedScanId] = useState("");
  const [widthFt, setWidthFt] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/projects/${id}/scans`).then(r => r.json()).then(data => {
      const imagescans = data.filter((s: ScanFile) => s.fileType === "PNG" || s.fileType === "JPG");
      setScans(imagescans);
    });
    fetch(`/api/projects/${id}/floor-plans`).then(r => r.json()).then(data => {
      setFloorPlans(data);
      if (data.length > 0) setActivePlan(data[0]);
    });
  }, [id]);

  async function generateFloorPlan() {
    if (!selectedScanId) { setError("Select a scan image first"); return; }
    setGenerating(true);
    setError("");
    const res = await fetch(`/api/projects/${id}/floor-plans/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scanFileId: selectedScanId,
        widthFt: widthFt ? parseFloat(widthFt) : undefined,
        heightFt: heightFt ? parseFloat(heightFt) : undefined,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      let msg = "Generation failed";
      try { msg = JSON.parse(text).error || msg; } catch { msg = text || `Server error ${res.status}`; }
      setError(msg);
    } else {
      const plan = await res.json();
      setFloorPlans(prev => [plan, ...prev]);
      setActivePlan(plan);
    }
    setGenerating(false);
  }

  async function savePlan(svgContent: string) {
    if (!activePlan) return;
    await fetch(`/api/projects/${id}/floor-plans/${activePlan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ svgContent }),
    });
  }

  const imageScans = scans.filter(s => s.fileType === "PNG" || s.fileType === "JPG");

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <h1 className="text-xl font-bold">Floor Plan</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Generate Floor Plan from Scan
          </CardTitle>
          <CardDescription>
            Upload a 2D floor plan image from Polycam or Magicplan, then generate an editable SVG using Claude AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {imageScans.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              No floor plan images found. Go to <strong>LiDAR Scans</strong> and upload a PNG/JPG floor plan export from Polycam or Magicplan.
            </p>
          ) : (
            <>
              <div className="space-y-1">
                <Label>Select Floor Plan Image</Label>
                <Select value={selectedScanId} onValueChange={setSelectedScanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a scan image..." />
                  </SelectTrigger>
                  <SelectContent>
                    {imageScans.map(scan => (
                      <SelectItem key={scan.id} value={scan.id}>
                        {scan.originalName} ({scan.source})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Width (ft) — optional</Label>
                  <Input type="number" placeholder="e.g. 24" value={widthFt} onChange={e => setWidthFt(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Depth (ft) — optional</Label>
                  <Input type="number" placeholder="e.g. 18" value={heightFt} onChange={e => setHeightFt(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
              <Button onClick={generateFloorPlan} disabled={generating || !selectedScanId}>
                {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating with Claude...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate SVG Floor Plan</>}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {floorPlans.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {floorPlans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setActivePlan(plan)}
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                activePlan?.id === plan.id
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
            >
              {plan.name}
              {plan.sourceType === "AI_GENERATED" && (
                <Badge variant="default" className="ml-1.5 text-xs">AI</Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {activePlan ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Home className="h-4 w-4" /> {activePlan.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                {activePlan.widthFt && activePlan.heightFt && (
                  <span className="text-xs text-[var(--muted-foreground)]">{activePlan.widthFt}′ × {activePlan.heightFt}′</span>
                )}
                <Badge variant={activePlan.sourceType === "AI_GENERATED" ? "default" : "secondary"}>
                  {activePlan.sourceType === "AI_GENERATED" ? "AI Generated" : "Manual"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <FloorPlanEditor svgContent={activePlan.svgContent} onSave={savePlan} />
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-16 text-[var(--muted-foreground)]">
          <Home className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No floor plan yet. Generate one from a scan or create one manually.</p>
        </div>
      )}
    </div>
  );
}
