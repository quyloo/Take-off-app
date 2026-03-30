"use client";
import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { calcEstimateTotals } from "@/lib/estimate-utils";
import { FileSignature, Download, Save, Loader2 } from "lucide-react";
import type { EstimateLineItem } from "@prisma/client";

interface Proposal {
  id: string; title: string; intro?: string; scopeNotes?: string; terms?: string;
  validUntil?: string; status: string; pdfPath?: string;
}
interface Project {
  name: string; address: string; clientName: string; clientEmail?: string;
}
interface Estimate {
  contingency: number; markup: number;
  lineItems: EstimateLineItem[];
}

const DEFAULT_TERMS = `Payment Terms: 50% deposit due at contract signing. Balance due upon project completion.
This proposal is valid for 30 days from the date of issue.
Prices are subject to change if scope changes are requested.
All work to be completed in a professional manner according to standard practices.`;

export default function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [renderings, setRenderings] = useState<{ id: string; filePath: string; name: string }[]>([]);
  const [floorPlans, setFloorPlans] = useState<{ id: string; svgContent: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [form, setForm] = useState({
    title: "", intro: "", scopeNotes: "", terms: DEFAULT_TERMS,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then(r => r.json()),
      fetch(`/api/projects/${id}/proposal`).then(r => r.json()),
      fetch(`/api/projects/${id}/estimate`).then(r => r.json()),
      fetch(`/api/projects/${id}/renderings`).then(r => r.json()),
      fetch(`/api/projects/${id}/floor-plans`).then(r => r.json()),
    ]).then(([proj, prop, est, rend, fps]) => {
      setProject(proj);
      setEstimate(est);
      setRenderings(rend || []);
      setFloorPlans(fps || []);
      if (prop) {
        setProposal(prop);
        setForm({
          title: prop.title || `${proj.name} — Proposal`,
          intro: prop.intro || "",
          scopeNotes: prop.scopeNotes || "",
          terms: prop.terms || DEFAULT_TERMS,
        });
      } else {
        setForm(f => ({ ...f, title: `${proj.name} — Proposal` }));
      }
    });
  }, [id]);

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function save() {
    setSaving(true);
    const body = { ...form };
    if (proposal) {
      const res = await fetch(`/api/projects/${id}/proposal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setProposal(await res.json());
    } else {
      const res = await fetch(`/api/projects/${id}/proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setProposal(await res.json());
    }
    setSaving(false);
  }

  async function exportPDF() {
    setExporting(true);
    // Save first
    await save();
    // For now, trigger a print of the preview
    window.print();
    setExporting(false);
  }

  const totals = estimate ? calcEstimateTotals(estimate.lineItems, estimate.contingency, estimate.markup) : null;

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Proposal</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={save} disabled={saving}>
            <Save className="h-3 w-3 mr-1" />{saving ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" onClick={exportPDF} disabled={exporting}>
            {exporting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Proposal Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={form.title} onChange={e => setField("title", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Introduction / Cover Letter</Label>
            <Textarea
              value={form.intro}
              onChange={e => setField("intro", e.target.value)}
              placeholder="Thank you for the opportunity to work on your project..."
              rows={4}
            />
          </div>
          <div className="space-y-1">
            <Label>Scope of Work</Label>
            <Textarea
              value={form.scopeNotes}
              onChange={e => setField("scopeNotes", e.target.value)}
              placeholder="Describe the work to be performed..."
              rows={5}
            />
          </div>
          <div className="space-y-1">
            <Label>Terms & Conditions</Label>
            <Textarea
              value={form.terms}
              onChange={e => setField("terms", e.target.value)}
              rows={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Proposal Preview */}
      <Card className="print:shadow-none print:border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Preview</CardTitle>
            {proposal && (
              <Badge variant={proposal.status === "DRAFT" ? "outline" : "default"}>
                {proposal.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="border border-[var(--border)] rounded-lg p-8 bg-white space-y-6 print:border-0">
            <div className="border-b pb-4">
              <h1 className="text-2xl font-bold">{form.title || "Project Proposal"}</h1>
              {project && (
                <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                  <p>Prepared for: <strong className="text-[var(--foreground)]">{project.clientName}</strong></p>
                  <p>Property: {project.address}</p>
                  <p>Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              )}
            </div>

            {form.intro && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Introduction</h2>
                <p className="text-sm whitespace-pre-wrap">{form.intro}</p>
              </div>
            )}

            {floorPlans.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Floor Plan</h2>
                <div
                  className="border border-[var(--border)] rounded-lg overflow-hidden p-2 bg-[var(--muted)]"
                  dangerouslySetInnerHTML={{ __html: floorPlans[0].svgContent }}
                />
              </div>
            )}

            {renderings.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Design Renderings</h2>
                <div className="grid grid-cols-2 gap-3">
                  {renderings.slice(0, 4).map(r => (
                    <div key={r.id} className="rounded-lg overflow-hidden border border-[var(--border)]">
                      <img src={r.filePath} alt={r.name} className="w-full aspect-video object-cover" />
                      <p className="text-xs text-center py-1 text-[var(--muted-foreground)]">{r.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {form.scopeNotes && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Scope of Work</h2>
                <p className="text-sm whitespace-pre-wrap">{form.scopeNotes}</p>
              </div>
            )}

            {totals && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Investment Summary</h2>
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    <tr className="border-b border-[var(--border)]">
                      <td className="py-1.5 text-[var(--muted-foreground)]">Materials</td>
                      <td className="text-right py-1.5">{formatCurrency(totals.subtotalMaterials)}</td>
                    </tr>
                    <tr className="border-b border-[var(--border)]">
                      <td className="py-1.5 text-[var(--muted-foreground)]">Labor</td>
                      <td className="text-right py-1.5">{formatCurrency(totals.subtotalLabor)}</td>
                    </tr>
                    <tr className="border-b border-[var(--border)]">
                      <td className="py-1.5 text-[var(--muted-foreground)]">Contingency</td>
                      <td className="text-right py-1.5">{formatCurrency(totals.contingencyAmt)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-semibold text-base">Total Project Investment</td>
                      <td className="text-right py-2 font-bold text-base text-[var(--primary)]">{formatCurrency(totals.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {form.terms && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Terms & Conditions</h2>
                <p className="text-sm whitespace-pre-wrap text-[var(--muted-foreground)]">{form.terms}</p>
              </div>
            )}

            <div className="border-t pt-4 grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-medium mb-8">Client Signature</p>
                <div className="border-b border-[var(--foreground)] mb-1"></div>
                <p className="text-xs text-[var(--muted-foreground)]">Date</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-8">Contractor Signature</p>
                <div className="border-b border-[var(--foreground)] mb-1"></div>
                <p className="text-xs text-[var(--muted-foreground)]">Date</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
