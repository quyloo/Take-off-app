import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plans = await prisma.floorPlan.findMany({
    where: { projectId: id },
    orderBy: { version: "desc" },
  });
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const plan = await prisma.floorPlan.create({
    data: { projectId: id, sourceType: "MANUAL", svgContent: body.svgContent || "", ...body },
  });
  return NextResponse.json(plan, { status: 201 });
}
