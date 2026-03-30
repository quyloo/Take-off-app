import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcEstimateTotals } from "@/lib/estimate-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const estimate = await prisma.estimate.findUnique({
    where: { projectId: id },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(estimate);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const estimate = await prisma.estimate.create({
    data: { projectId: id, ...body },
    include: { lineItems: true },
  });
  return NextResponse.json(estimate, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const estimate = await prisma.estimate.findUnique({
    where: { projectId: id },
    include: { lineItems: true },
  });
  if (!estimate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { subtotalMaterials, subtotalLabor } = calcEstimateTotals(
    estimate.lineItems,
    body.contingency ?? estimate.contingency,
    body.markup ?? estimate.markup
  );

  const updated = await prisma.estimate.update({
    where: { projectId: id },
    data: { ...body, totalMaterials: subtotalMaterials, totalLabor: subtotalLabor },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(updated);
}
