"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  MousePointer2, Minus, DoorOpen, Square, Type, 
  Save, ZoomIn, ZoomOut, RotateCcw, Download
} from "lucide-react";

interface FloorPlanEditorProps {
  svgContent: string;
  onSave: (svgContent: string) => Promise<void>;
}

type Tool = "select" | "wall" | "door" | "window" | "text";

export function FloorPlanEditor({ svgContent, onSave }: FloorPlanEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const fabricRef = useRef<import("fabric").Canvas | null>(null);

  useEffect(() => {
    let canvas: import("fabric").Canvas | null = null;

    async function initFabric() {
      const { Canvas, loadSVGFromString, util } = await import("fabric");
      const el = document.getElementById("floor-plan-canvas") as HTMLCanvasElement;
      if (!el) return;

      canvas = new Canvas(el, {
        width: 900,
        height: 620,
        backgroundColor: "#f8fafc",
        selection: true,
      });
      fabricRef.current = canvas;

      if (svgContent) {
        try {
          const { objects, options } = await loadSVGFromString(svgContent);
          const filtered = objects.filter(Boolean) as NonNullable<typeof objects[0]>[];
          const group = util.groupSVGElements(filtered, options);
          // Scale to fit canvas
          const scaleX = 860 / (group.width || 800);
          const scaleY = 580 / (group.height || 600);
          const scale = Math.min(scaleX, scaleY, 1);
          group.set({ left: 20, top: 20, scaleX: scale, scaleY: scale });
          canvas.add(group);
          canvas.renderAll();
        } catch (e) {
          console.warn("SVG parse error", e);
        }
      }
    }

    initFabric();
    return () => { canvas?.dispose(); };
  }, [svgContent]);

  async function handleSave() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setSaving(true);
    const svg = canvas.toSVG();
    await onSave(svg);
    setSaving(false);
  }

  function handleZoomIn() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const newZoom = Math.min(zoom * 1.2, 3);
    canvas.setZoom(newZoom);
    setZoom(newZoom);
  }

  function handleZoomOut() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const newZoom = Math.max(zoom / 1.2, 0.3);
    canvas.setZoom(newZoom);
    setZoom(newZoom);
  }

  function handleReset() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setZoom(1);
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoom(1);
  }

  async function handleAddWall() {
    const { Line } = await import("fabric");
    const canvas = fabricRef.current;
    if (!canvas) return;
    const line = new Line([50, 100, 250, 100], {
      stroke: "#1e293b", strokeWidth: 3, selectable: true,
    });
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
  }

  async function handleAddText() {
    const { IText } = await import("fabric");
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new IText("Room Label", {
      left: 100, top: 200, fontSize: 14, fill: "#334155",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }

  async function handleAddDoor() {
    const { Circle } = await import("fabric");
    const canvas = fabricRef.current;
    if (!canvas) return;
    const arc = new Circle({
      left: 150, top: 150, radius: 30,
      fill: "transparent", stroke: "#64748b", strokeWidth: 2,
      startAngle: 0, endAngle: 90,
    });
    canvas.add(arc);
    canvas.setActiveObject(arc);
    canvas.renderAll();
  }

  async function handleAddWindow() {
    const { Rect } = await import("fabric");
    const canvas = fabricRef.current;
    if (!canvas) return;
    const win = new Rect({
      left: 200, top: 100, width: 40, height: 8,
      fill: "#e2e8f0", stroke: "#94a3b8", strokeWidth: 2,
    });
    canvas.add(win);
    canvas.setActiveObject(win);
    canvas.renderAll();
  }

  function handleDownload() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const svg = canvas.toSVG();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "floor-plan.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  const TOOLS = [
    { id: "select" as Tool, icon: MousePointer2, label: "Select", action: () => setActiveTool("select") },
    { id: "wall" as Tool, icon: Minus, label: "Add Wall", action: handleAddWall },
    { id: "door" as Tool, icon: DoorOpen, label: "Add Door", action: handleAddDoor },
    { id: "window" as Tool, icon: Square, label: "Add Window", action: handleAddWindow },
    { id: "text" as Tool, icon: Type, label: "Add Label", action: handleAddText },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 border border-[var(--border)] rounded-md p-1 bg-white">
          {TOOLS.map(tool => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={tool.action}
                title={tool.label}
                className={`p-1.5 rounded transition-colors ${
                  activeTool === tool.id
                    ? "bg-[var(--primary)] text-white"
                    : "hover:bg-[var(--muted)] text-[var(--foreground)]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 border border-[var(--border)] rounded-md p-1 bg-white">
          <button onClick={handleZoomOut} title="Zoom Out" className="p-1.5 rounded hover:bg-[var(--muted)]">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs px-1 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} title="Zoom In" className="p-1.5 rounded hover:bg-[var(--muted)]">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={handleReset} title="Reset View" className="p-1.5 rounded hover:bg-[var(--muted)]">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-3 w-3 mr-1" /> SVG
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-3 w-3 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="border border-[var(--border)] rounded-lg overflow-hidden bg-white"
        style={{ width: "100%", overflowX: "auto" }}
      >
        <canvas id="floor-plan-canvas" />
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        Click to select elements · Drag to move · Double-click text to edit · Delete key to remove
      </p>
    </div>
  );
}
