import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export type UploadCategory = "photos" | "scans" | "floor-plans" | "renderings";

export function getUploadDir(projectId: string, category: UploadCategory): string {
  const dir = path.join(process.cwd(), "public", "uploads", projectId, category);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getUploadPath(projectId: string, category: UploadCategory, filename: string): string {
  const dir = getUploadDir(projectId, category);
  return path.join(dir, filename);
}

export function getPublicUrl(projectId: string, category: UploadCategory, filename: string): string {
  return `/uploads/${projectId}/${category}/${filename}`;
}

export function generateFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  return `${uuidv4()}${ext}`;
}

export async function saveFile(buffer: Buffer, filePath: string): Promise<void> {
  await fs.promises.writeFile(filePath, buffer);
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const absolutePath = filePath.startsWith("/uploads/")
      ? path.join(process.cwd(), "public", filePath)
      : filePath;
    await fs.promises.unlink(absolutePath);
  } catch {
    // ignore if file doesn't exist
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
