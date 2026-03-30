import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      siteNotes: { orderBy: { createdAt: "desc" } },
      photos: { orderBy: { sortOrder: "asc" } },
      scanFiles: { orderBy: { createdAt: "desc" } },
      floorPlans: { where: { isActive: true }, orderBy: { version: "desc" } },
      renderings: { orderBy: { createdAt: "desc" } },
      estimate: { include: { lineItems: { orderBy: { sortOrder: "asc" } } } },
      proposal: { include: { sections: { orderBy: { sortOrder: "asc" } } } },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const project = await prisma.project.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
