import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { buildFloorPlanPrompt } from "@/lib/floor-plan-prompt";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { scanFileId, widthFt, heightFt } = await req.json();

  if (!scanFileId) {
    return NextResponse.json({ error: "scanFileId required" }, { status: 400 });
  }

  const scan = await prisma.scanFile.findUnique({ where: { id: scanFileId } });
  if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });

  const imageExtensions = ["png", "jpg", "jpeg", "pdf"];
  const ext = path.extname(scan.originalName).toLowerCase().slice(1);
  if (!imageExtensions.includes(ext)) {
    return NextResponse.json({ error: "Selected scan must be a PNG, JPG, or PDF floor plan image" }, { status: 400 });
  }

  const absolutePath = path.join(process.cwd(), "public", scan.filePath);
  const imageData = fs.readFileSync(absolutePath);
  const base64 = imageData.toString("base64");
  const mediaType = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";

  const prompt = buildFloorPlanPrompt(widthFt, heightFt);

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType as "image/png" | "image/jpeg", data: base64 },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const textContent = message.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    return NextResponse.json({ error: "No SVG returned from Claude" }, { status: 500 });
  }

  let svgContent = textContent.text.trim();
  // Strip any markdown code fences if present
  svgContent = svgContent.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();

  // Get max version for this project
  const existing = await prisma.floorPlan.findMany({ where: { projectId: id } });
  const maxVersion = existing.reduce((m, p) => Math.max(m, p.version), 0);

  const plan = await prisma.floorPlan.create({
    data: {
      projectId: id,
      name: `Floor Plan v${maxVersion + 1}`,
      svgContent,
      version: maxVersion + 1,
      sourceType: "AI_GENERATED",
      sourceScanId: scanFileId,
      widthFt: widthFt || null,
      heightFt: heightFt || null,
    },
  });

  return NextResponse.json(plan, { status: 201 });
}
