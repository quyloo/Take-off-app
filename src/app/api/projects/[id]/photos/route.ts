import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFilename, getUploadDir, getPublicUrl, saveFile } from "@/lib/upload";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photos = await prisma.photo.findMany({
    where: { projectId: id },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(photos);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  const caption = formData.get("caption") as string | null;
  const roomLabel = formData.get("roomLabel") as string | null;

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const uploadDir = getUploadDir(id, "photos");
  const saved = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = generateFilename(file.name);
    const filePath = `${uploadDir}/${filename}`;
    await saveFile(buffer, filePath);

    const photo = await prisma.photo.create({
      data: {
        projectId: id,
        filename,
        originalName: file.name,
        filePath: getPublicUrl(id, "photos", filename),
        fileSize: buffer.length,
        mimeType: file.type,
        caption: caption || null,
        roomLabel: roomLabel || null,
      },
    });
    saved.push(photo);
  }

  return NextResponse.json(saved, { status: 201 });
}
