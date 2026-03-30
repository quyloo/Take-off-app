import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFilename, getUploadDir, getPublicUrl, saveFile } from "@/lib/upload";
import { ScanFileType, ScanSource } from "@prisma/client";
import path from "path";

function extToFileType(filename: string): ScanFileType {
  const ext = path.extname(filename).toLowerCase().slice(1);
  const map: Record<string, ScanFileType> = {
    obj: "OBJ", glb: "GLB", usdz: "USDZ",
    png: "PNG", jpg: "JPG", jpeg: "JPG",
    pdf: "PDF",
  };
  return map[ext] || "OTHER";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scans = await prisma.scanFile.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(scans);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  const source = (formData.get("source") as ScanSource) || "OTHER";

  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

  const uploadDir = getUploadDir(id, "scans");
  const saved = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = generateFilename(file.name);
    const filePath = `${uploadDir}/${filename}`;
    await saveFile(buffer, filePath);

    const scan = await prisma.scanFile.create({
      data: {
        projectId: id,
        filename,
        originalName: file.name,
        filePath: getPublicUrl(id, "scans", filename),
        fileSize: buffer.length,
        fileType: extToFileType(file.name),
        source,
      },
    });
    saved.push(scan);
  }

  return NextResponse.json(saved, { status: 201 });
}
