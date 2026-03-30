import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Plus, MapPin, User, Camera, ScanLine, Image } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  PROPOSAL_SENT: "Proposal Sent",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "warning" | "outline"> = {
  ACTIVE: "default",
  PROPOSAL_SENT: "warning",
  IN_PROGRESS: "success",
  COMPLETED: "secondary",
  ARCHIVED: "outline",
};

export default async function Dashboard() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { photos: true, scanFiles: true, renderings: true } },
    },
  });

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      <header className="bg-[var(--sidebar-bg,#0f172a)] text-white px-6 py-4 flex items-center justify-between shadow">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Take-off App</h1>
          <p className="text-slate-400 text-xs mt-0.5">Residential renovation project management</p>
        </div>
        <Link href="/projects/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {projects.length} Project{projects.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-24 text-[var(--muted-foreground)]">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-lg font-medium mb-2">No projects yet</p>
            <p className="text-sm mb-6">Create your first project to get started.</p>
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" /> New Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link href={`/projects/${project.id}`} key={project.id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">{project.name}</CardTitle>
                      <Badge variant={STATUS_VARIANTS[project.status]}>
                        {STATUS_LABELS[project.status]}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <User className="h-3 w-3" /> {project.clientName}
                    </CardDescription>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {project.address}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1"><Camera className="h-3 w-3" />{project._count.photos} photos</span>
                      <span className="flex items-center gap-1"><ScanLine className="h-3 w-3" />{project._count.scanFiles} scans</span>
                      <span className="flex items-center gap-1"><Image className="h-3 w-3" />{project._count.renderings} renders</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-2">
                      Created {formatDate(project.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
