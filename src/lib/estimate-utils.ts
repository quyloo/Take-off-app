import { EstimateLineItem } from "@prisma/client";

export function calcLineTotal(item: EstimateLineItem): number {
  const materials = item.quantity * item.unitCost;
  const labor = item.laborHours * item.laborRate;
  return materials + labor;
}

export function calcEstimateTotals(
  items: EstimateLineItem[],
  contingency: number,
  markup: number
) {
  const subtotalMaterials = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
  const subtotalLabor = items.reduce((sum, i) => sum + i.laborHours * i.laborRate, 0);
  const subtotal = subtotalMaterials + subtotalLabor;
  const contingencyAmt = subtotal * contingency;
  const markupAmt = (subtotal + contingencyAmt) * markup;
  const total = subtotal + contingencyAmt + markupAmt;
  return { subtotalMaterials, subtotalLabor, subtotal, contingencyAmt, markupAmt, total };
}

export const CATEGORY_LABELS: Record<string, string> = {
  DEMO: "Demo & Removal",
  FRAMING: "Framing",
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
  HVAC: "HVAC",
  INSULATION: "Insulation",
  DRYWALL: "Drywall",
  FLOORING: "Flooring",
  TILE: "Tile",
  PAINTING: "Painting",
  CABINETRY: "Cabinetry",
  COUNTERTOPS: "Countertops",
  DOORS_WINDOWS: "Doors & Windows",
  FIXTURES: "Fixtures",
  APPLIANCES: "Appliances",
  FINISH_CARPENTRY: "Finish Carpentry",
  GENERAL: "General",
};
