"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Save, Trash2, Plus } from "lucide-react";
import Image from "next/image";

interface Note { id: string; content: string; createdAt: string; }
interface Photo { id: string; filePath: string; originalName: string; caption?: string; roomLabel?: string; }

export default function DocumentationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [notes, setNotes] = useState<Note[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [roomLabel, setRoomLabel] = useState("");

  useEffect(() => {
    fetch(`/api/projects/${id}/notes`).then(r => r.json()).then(setNotes);
    fetch(`/api/projects/${id}/photos`).then(r => r.json()).then(setPhotos);
  }, [id]);

  async function saveNote() {
    if (!noteContent.trim()) return;
    setSavingNote(true);
    const res = await fetch(`/api/projects/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteContent }),
    });
    const note = await res.json();
    setNotes(prev => [note, ...prev]);
    setNoteContent("");
    setSavingNote(false);
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    const fd = new FormData();
    acceptedFiles.forEach(f => fd.append("files", f));
    if (roomLabel) fd.append("roomLabel", roomLabel);
    const res = await fetch(`/api/projects/${id}/photos`, { method: "POST", body: fd });
    const saved = await res.json();
    setPhotos(prev => [...prev, ...saved]);
    setUploading(false);
  }, [id, roomLabel]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic"] },
    multiple: true,
  });

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <h1 className="text-xl font-bold">Site Notes & Photos</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Site Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Describe what you observed on site — existing conditions, client requests, measurements, issues..."
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            rows={4}
          />
          <Button onClick={saveNote} disabled={savingNote || !noteContent.trim()} size="sm">
            <Save className="h-3 w-3 mr-1" />
            {savingNote ? "Saving..." : "Save Note"}
          </Button>
        </CardContent>
      </Card>

      {notes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Site Notes ({notes.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notes.map(note => (
              <div key={note.id} className="border border-[var(--border)] rounded-md p-3 text-sm">
                <p className="whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Camera className="h-4 w-4" /> Upload Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-center">
            <input
              className="flex h-9 rounded-md border border-[var(--border)] bg-white px-3 py-1 text-sm flex-1"
              placeholder="Room label (e.g. Kitchen, Master Bath)"
              value={roomLabel}
              onChange={e => setRoomLabel(e.target.value)}
            />
          </div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-[var(--primary)] bg-blue-50" : "border-[var(--border)] hover:border-[var(--primary)]"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-[var(--muted-foreground)]" />
            {isDragActive ? (
              <p className="text-sm text-[var(--primary)]">Drop photos here...</p>
            ) : (
              <div>
                <p className="text-sm font-medium">Drag & drop photos here</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">or click to select files — JPG, PNG, HEIC supported</p>
              </div>
            )}
          </div>
          {uploading && <p className="text-sm text-[var(--muted-foreground)]">Uploading...</p>}
        </CardContent>
      </Card>

      {photos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Site Photos ({photos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map(photo => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-[var(--muted)] border border-[var(--border)]">
                    <img
                      src={photo.filePath}
                      alt={photo.originalName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {photo.roomLabel && (
                    <Badge variant="secondary" className="absolute top-1 left-1 text-xs">
                      {photo.roomLabel}
                    </Badge>
                  )}
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 truncate">{photo.originalName}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
