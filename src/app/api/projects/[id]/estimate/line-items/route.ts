import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcEstimateTotals } from "@/lib/estimate-utils";

async function recalcEstimate(estimateId: string) {
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: { lineItems: true },
  });
  if (!estimate) return;
  const { subtotalMaterials, subtotalLabor } = calcEstimateTotals(
    estimate.lineItems,
    estimate.contingency,
    estimate.markup
  );
  await prisma.estimate.update({
    where: { id: estimateId },
    data: { totalMaterials: subtotalMaterials, totalLabor: subtotalLabor },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let estimate = await prisma.estimate.findUnique({ where: { projectId: id } });
  if (!estimate) {
    estimate = await prisma.estimate.create({ data: { projectId: id } });
  }

  const body = await req.json();
  const item = await prisma.estimateLineItem.create({
    data: { estimateId: estimate.id, ...body },
  });

  await recalcEstimate(estimate.id);
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const { itemId, ...body } = await req.json();
  const item = await prisma.estimateLineItem.update({ where: { id: itemId }, data: body });
  const estimate = await prisma.estimate.findUnique({ where: { projectId } });
  if (estimate) await recalcEstimate(estimate.id);
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  await prisma.estimateLineItem.delete({ where: { id: itemId } });
  const estimate = await prisma.estimate.findUnique({ where: { projectId } });
  if (estimate) await recalcEstimate(estimate.id);
  return NextResponse.json({ success: true });
}
