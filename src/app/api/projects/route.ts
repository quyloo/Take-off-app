import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { photos: true, scanFiles: true, renderings: true },
      },
    },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, address, clientName, clientEmail, clientPhone } = body;

  if (!name || !address || !clientName) {
    return NextResponse.json({ error: "name, address, and clientName are required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: { name, address, clientName, clientEmail, clientPhone },
  });

  return NextResponse.json(project, { status: 201 });
}
