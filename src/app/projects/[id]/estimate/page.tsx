"use client";
import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { calcEstimateTotals, calcLineTotal, CATEGORY_LABELS } from "@/lib/estimate-utils";
import { Plus, Trash2, Calculator } from "lucide-react";
import type { EstimateLineItem } from "@prisma/client";

interface Estimate {
  id: string; contingency: number; markup: number; notes?: string;
  lineItems: EstimateLineItem[];
}

const CATEGORIES = Object.entries(CATEGORY_LABELS);
const UNITS = ["sq ft", "linear ft", "each", "hour", "lot", "sq yd"];

export default function EstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    category: "GENERAL",
    description: "",
    unit: "sq ft",
    quantity: "",
    unitCost: "",
    laborHours: "",
    laborRate: "85",
  });

  useEffect(() => {
    fetch(`/api/projects/${id}/estimate`).then(r => r.json()).then(data => {
      setEstimate(data);
      setLoading(false);
    });
  }, [id]);

  async function createEstimate() {
    const res = await fetch(`/api/projects/${id}/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setEstimate(data);
  }

  async function addLineItem() {
    if (!newItem.description || !newItem.quantity || !newItem.unitCost) return;
    setAdding(true);
    const res = await fetch(`/api/projects/${id}/estimate/line-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: newItem.category,
        description: newItem.description,
        unit: newItem.unit,
        quantity: parseFloat(newItem.quantity),
        unitCost: parseFloat(newItem.unitCost),
        laborHours: parseFloat(newItem.laborHours || "0"),
        laborRate: parseFloat(newItem.laborRate || "85"),
      }),
    });
    const item = await res.json();
    setEstimate(prev => prev ? { ...prev, lineItems: [...prev.lineItems, item] } : prev);
    setNewItem({ category: "GENERAL", description: "", unit: "sq ft", quantity: "", unitCost: "", laborHours: "", laborRate: "85" });
    // Refresh to get updated totals
    fetch(`/api/projects/${id}/estimate`).then(r => r.json()).then(setEstimate);
    setAdding(false);
  }

  async function deleteItem(itemId: string) {
    await fetch(`/api/projects/${id}/estimate/line-items?itemId=${itemId}`, { method: "DELETE" });
    fetch(`/api/projects/${id}/estimate`).then(r => r.json()).then(setEstimate);
  }

  async function updateRate(field: "contingency" | "markup", value: string) {
    const num = parseFloat(value) / 100;
    await fetch(`/api/projects/${id}/estimate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: num }),
    });
    fetch(`/api/projects/${id}/estimate`).then(r => r.json()).then(setEstimate);
  }

  if (loading) return <div className="p-6 text-[var(--muted-foreground)]">Loading...</div>;

  if (!estimate) return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold mb-4">Estimate</h1>
      <div className="text-center py-16">
        <Calculator className="h-12 w-12 mx-auto mb-3 opacity-30 text-[var(--muted-foreground)]" />
        <p className="text-[var(--muted-foreground)] mb-4">No estimate yet.</p>
        <Button onClick={createEstimate}>Create Estimate</Button>
      </div>
    </div>
  );

  const totals = calcEstimateTotals(estimate.lineItems, estimate.contingency, estimate.markup);

  // Group by category
  const byCategory = estimate.lineItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, EstimateLineItem[]>);

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <h1 className="text-xl font-bold">Estimate</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Materials", value: totals.subtotalMaterials },
          { label: "Labor", value: totals.subtotalLabor },
          { label: "Contingency", value: totals.contingencyAmt },
          { label: "Total", value: totals.total },
        ].map(s => (
          <Card key={s.label} className={s.label === "Total" ? "border-[var(--primary)] bg-blue-50" : ""}>
            <CardContent className="p-4">
              <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
              <p className={`text-lg font-bold ${s.label === "Total" ? "text-[var(--primary)]" : ""}`}>
                {formatCurrency(s.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Settings */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Settings</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-1">
              <label className="text-xs text-[var(--muted-foreground)]">Contingency %</label>
              <Input
                type="number" className="w-24"
                defaultValue={estimate.contingency * 100}
                onBlur={e => updateRate("contingency", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--muted-foreground)]">Markup %</label>
              <Input
                type="number" className="w-24"
                defaultValue={estimate.markup * 100}
                onBlur={e => updateRate("markup", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Line Item */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Plus className="h-4 w-4" />Add Line Item</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select value={newItem.category} onValueChange={v => setNewItem(p => ({...p, category: v}))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Description" value={newItem.description} onChange={e => setNewItem(p => ({...p, description: e.target.value}))} className="col-span-2 sm:col-span-2" />
            <Select value={newItem.unit} onValueChange={v => setNewItem(p => ({...p, unit: v}))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Input type="number" placeholder="Quantity" value={newItem.quantity} onChange={e => setNewItem(p => ({...p, quantity: e.target.value}))} />
            <Input type="number" placeholder="Unit Cost $" value={newItem.unitCost} onChange={e => setNewItem(p => ({...p, unitCost: e.target.value}))} />
            <Input type="number" placeholder="Labor Hours" value={newItem.laborHours} onChange={e => setNewItem(p => ({...p, laborHours: e.target.value}))} />
            <Input type="number" placeholder="Labor Rate $/hr" value={newItem.laborRate} onChange={e => setNewItem(p => ({...p, laborRate: e.target.value}))} />
          </div>
          <Button size="sm" onClick={addLineItem} disabled={adding || !newItem.description || !newItem.quantity || !newItem.unitCost}>
            {adding ? "Adding..." : "Add Item"}
          </Button>
        </CardContent>
      </Card>

      {/* Line Items by Category */}
      {Object.entries(byCategory).map(([category, items]) => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>{CATEGORY_LABELS[category] || category}</span>
              <Badge variant="secondary">
                {formatCurrency(items.reduce((s, i) => s + calcLineTotal(i), 0))}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-[var(--muted-foreground)] border-b border-[var(--border)]">
                    <th className="text-left py-1 pr-3">Description</th>
                    <th className="text-right py-1 pr-3">Qty</th>
                    <th className="text-right py-1 pr-3">Unit</th>
                    <th className="text-right py-1 pr-3">Unit Cost</th>
                    <th className="text-right py-1 pr-3">Labor</th>
                    <th className="text-right py-1">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-1.5 pr-3">{item.description}</td>
                      <td className="text-right py-1.5 pr-3">{item.quantity}</td>
                      <td className="text-right py-1.5 pr-3 text-[var(--muted-foreground)]">{item.unit}</td>
                      <td className="text-right py-1.5 pr-3">{formatCurrency(item.unitCost)}</td>
                      <td className="text-right py-1.5 pr-3 text-[var(--muted-foreground)]">
                        {item.laborHours > 0 ? `${item.laborHours}h @ $${item.laborRate}` : "—"}
                      </td>
                      <td className="text-right py-1.5 font-medium">{formatCurrency(calcLineTotal(item))}</td>
                      <td className="pl-2">
                        <button onClick={() => deleteItem(item.id)} className="text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {estimate.lineItems.length === 0 && (
        <div className="text-center py-8 text-[var(--muted-foreground)]">
          <p className="text-sm">No line items yet. Add your first item above.</p>
        </div>
      )}
    </div>
  );
}
