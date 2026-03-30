"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      address: fd.get("address"),
      clientName: fd.get("clientName"),
      clientEmail: fd.get("clientEmail") || undefined,
      clientPhone: fd.get("clientPhone") || undefined,
    };

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create project");
      setLoading(false);
      return;
    }

    const project = await res.json();
    router.push(`/projects/${project.id}`);
  }

  return (
    <div className="min-h-screen bg-[var(--muted)] flex items-start justify-center pt-12 px-4">
      <div className="w-full max-w-lg">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>New Project</CardTitle>
            <CardDescription>Create a new renovation project to start collecting site data.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Project Name *</Label>
                <Input id="name" name="name" placeholder="e.g. Johnson Kitchen Remodel" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">Property Address *</Label>
                <Input id="address" name="address" placeholder="123 Main St, City, State 00000" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input id="clientName" name="clientName" placeholder="Full name" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input id="clientEmail" name="clientEmail" type="email" placeholder="email@example.com" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="clientPhone">Client Phone</Label>
                  <Input id="clientPhone" name="clientPhone" type="tel" placeholder="(555) 000-0000" />
                </div>
              </div>
              {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
              <div className="flex gap-2 pt-2">
                <Link href="/" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">Cancel</Button>
                </Link>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
