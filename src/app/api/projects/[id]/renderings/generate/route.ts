import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { genAI, GEMINI_IMAGE_MODEL } from "@/lib/gemini";
import { buildRenderingPrompt, RenderingOptions } from "@/lib/rendering-prompt";
import { generateFilename, getUploadDir, getPublicUrl, saveFile } from "@/lib/upload";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { floorPlanId, style, roomType, flooring, wallColor, cabinetFinish, notes } = body;

  let widthFt: number | undefined;
  let heightFt: number | undefined;

  if (floorPlanId) {
    const plan = await prisma.floorPlan.findUnique({ where: { id: floorPlanId } });
    widthFt = plan?.widthFt ?? undefined;
    heightFt = plan?.heightFt ?? undefined;
  }

  const options: RenderingOptions = { style, roomType, flooring, wallColor, cabinetFinish, notes, widthFt, heightFt };
  const prompt = buildRenderingPrompt(options);

  const model = genAI.getGenerativeModel({ model: GEMINI_IMAGE_MODEL });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      // @ts-expect-error - responseModalities is supported in gemini-2.0-flash-exp
      responseModalities: ["IMAGE", "TEXT"],
    },
  });

  const response = result.response;
  const parts = response.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData);

  if (!imagePart?.inlineData) {
    return NextResponse.json({ error: "No image returned from Gemini" }, { status: 500 });
  }

  const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
  const filename = generateFilename("rendering.jpg");
  const uploadDir = getUploadDir(id, "renderings");
  await saveFile(imageBuffer, `${uploadDir}/${filename}`);

  const rendering = await prisma.rendering.create({
    data: {
      projectId: id,
      floorPlanId: floorPlanId || null,
      name: `${style} ${roomType}`,
      filePath: getPublicUrl(id, "renderings", filename),
      prompt,
      style,
      roomType,
      materials: JSON.stringify({ flooring, wallColor, cabinetFinish }),
      status: "COMPLETE",
    },
  });

  return NextResponse.json(rendering, { status: 201 });
}
