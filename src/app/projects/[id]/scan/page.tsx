"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, ScanLine, FileText } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface ScanFile {
  id: string; originalName: string; filePath: string; fileType: string;
  source: string; fileSize: number; createdAt: string; status: string;
}

const SOURCE_LABELS: Record<string, string> = {
  POLYCAM: "Polycam", MAGICPLAN: "Magicplan", ROOMSCAN: "RoomScan", OTHER: "Other",
};

const TYPE_COLORS: Record<string, "default" | "secondary" | "success" | "warning" | "outline"> = {
  PNG: "success", JPG: "success", PDF: "warning",
  OBJ: "secondary", GLB: "secondary", USDZ: "secondary", OTHER: "outline",
};

export default function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scans, setScans] = useState<ScanFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [source, setSource] = useState("POLYCAM");

  useEffect(() => {
    fetch(`/api/projects/${id}/scans`).then(r => r.json()).then(setScans);
  }, [id]);

  const onDrop = useCallback(async (files: File[]) => {
    setUploading(true);
    const fd = new FormData();
    files.forEach(f => fd.append("files", f));
    fd.append("source", source);
    const res = await fetch(`/api/projects/${id}/scans`, { method: "POST", body: fd });
    const saved = await res.json();
    setScans(prev => [...saved, ...prev]);
    setUploading(false);
  }, [id, source]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
      "model/obj": [".obj"],
      "model/gltf-binary": [".glb"],
      "model/vnd.usdz+zip": [".usdz"],
    },
    multiple: true,
  });

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">LiDAR Scans</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Upload floor plan images exported from Polycam or Magicplan. PNG/JPG floor plan exports are used to generate SVG floor plans via AI.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Upload Scan Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Source App</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POLYCAM">Polycam</SelectItem>
                <SelectItem value="MAGICPLAN">Magicplan</SelectItem>
                <SelectItem value="ROOMSCAN">RoomScan</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-[var(--primary)] bg-blue-50" : "border-[var(--border)] hover:border-[var(--primary)]"
            }`}
          >
            <input {...getInputProps()} />
            <ScanLine className="h-8 w-8 mx-auto mb-2 text-[var(--muted-foreground)]" />
            {isDragActive ? (
              <p className="text-sm text-[var(--primary)]">Drop files here...</p>
            ) : (
              <div>
                <p className="text-sm font-medium">Drop scan files here</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Floor plan images (PNG, JPG) — recommended for AI SVG generation<br />
                  3D files (OBJ, GLB, USDZ) — stored as reference
                </p>
              </div>
            )}
          </div>
          {uploading && <p className="text-sm text-[var(--muted-foreground)]">Uploading...</p>}
        </CardContent>
      </Card>

      {scans.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Uploaded Scans ({scans.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {scans.map(scan => (
              <div key={scan.id} className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-md">
                <FileText className="h-5 w-5 text-[var(--muted-foreground)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{scan.originalName}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatFileSize(scan.fileSize)} · {SOURCE_LABELS[scan.source]} · {new Date(scan.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={TYPE_COLORS[scan.fileType] || "outline"}>{scan.fileType}</Badge>
                  {(scan.fileType === "PNG" || scan.fileType === "JPG") && (
                    <Badge variant="default" className="text-xs">Floor Plan Ready</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
