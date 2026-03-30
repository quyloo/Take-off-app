import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = await prisma.proposal.findUnique({
    where: { projectId: id },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(proposal);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const proposal = await prisma.proposal.create({
    data: { projectId: id, title: body.title || "Project Proposal", ...body },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(proposal, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const proposal = await prisma.proposal.update({
    where: { projectId: id },
    data: body,
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(proposal);
}
