import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; fpId: string }> }) {
  const { fpId } = await params;
  const plan = await prisma.floorPlan.findUnique({ where: { id: fpId } });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(plan);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; fpId: string }> }) {
  const { fpId } = await params;
  const body = await req.json();
  const plan = await prisma.floorPlan.update({ where: { id: fpId }, data: body });
  return NextResponse.json(plan);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; fpId: string }> }) {
  const { fpId } = await params;
  await prisma.floorPlan.delete({ where: { id: fpId } });
  return NextResponse.json({ success: true });
}
