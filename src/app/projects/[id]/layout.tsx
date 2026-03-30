import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  FileText, Camera, ScanLine, LayoutDashboard,
  Image, Calculator, FileSignature, Home, ChevronLeft
} from "lucide-react";

const NAV_ITEMS = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/documentation", label: "Site Notes & Photos", icon: Camera },
  { href: "/scan", label: "LiDAR Scans", icon: ScanLine },
  { href: "/floor-plan", label: "Floor Plan", icon: Home },
  { href: "/renderings", label: "Renderings", icon: Image },
  { href: "/estimate", label: "Estimate", icon: Calculator },
  { href: "/proposal", label: "Proposal", icon: FileSignature },
];

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-[#0f172a] text-slate-300 flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b border-slate-700">
          <Link href="/" className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-2 transition-colors">
            <ChevronLeft className="h-3 w-3" /> All Projects
          </Link>
          <h2 className="text-sm font-semibold text-white leading-tight">{project.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{project.clientName}</p>
        </div>
        <nav className="flex-1 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const href = `/projects/${id}${item.href}`;
            return (
              <Link
                key={item.href}
                href={href}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 bg-[var(--muted)] overflow-auto">
        {children}
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
