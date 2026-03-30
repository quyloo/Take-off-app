import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import { calcEstimateTotals } from "@/lib/estimate-utils";
import { Camera, ScanLine, Image, MapPin, Mail, Phone, ArrowRight } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active", PROPOSAL_SENT: "Proposal Sent",
  IN_PROGRESS: "In Progress", COMPLETED: "Completed", ARCHIVED: "Archived",
};

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: { select: { photos: true, scanFiles: true, renderings: true, floorPlans: true, siteNotes: true } },
      estimate: { include: { lineItems: true } },
    },
  });
  if (!project) notFound();

  const estimateTotals = project.estimate
    ? calcEstimateTotals(project.estimate.lineItems, project.estimate.contingency, project.estimate.markup)
    : null;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{project.name}</h1>
            <p className="text-[var(--muted-foreground)] flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" /> {project.address}
            </p>
          </div>
          <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"}>
            {STATUS_LABELS[project.status]}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-4 mt-3 text-sm text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1"><span className="font-medium text-[var(--foreground)]">{project.clientName}</span></span>
          {project.clientEmail && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{project.clientEmail}</span>}
          {project.clientPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{project.clientPhone}</span>}
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">Created {formatDate(project.createdAt)}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Notes", value: project._count.siteNotes, href: "documentation" },
          { label: "Photos", value: project._count.photos, href: "documentation" },
          { label: "Scans", value: project._count.scanFiles, href: "scan" },
          { label: "Renderings", value: project._count.renderings, href: "renderings" },
        ].map((stat) => (
          <Link href={`/projects/${id}/${stat.href}`} key={stat.label}>
            <Card className="hover:shadow transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-[var(--primary)]">{stat.value}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {estimateTotals && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Estimate Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Materials</span><span>{formatCurrency(estimateTotals.subtotalMaterials)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Labor</span><span>{formatCurrency(estimateTotals.subtotalLabor)}</span></div>
              <div className="flex justify-between font-semibold border-t pt-1 mt-1"><span>Total</span><span>{formatCurrency(estimateTotals.total)}</span></div>
              <Link href={`/projects/${id}/estimate`}>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View Estimate <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/projects/${id}/documentation`}>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Camera className="h-3 w-3" /> Add Site Notes & Photos
              </Button>
            </Link>
            <Link href={`/projects/${id}/scan`}>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <ScanLine className="h-3 w-3" /> Upload LiDAR Scan
              </Button>
            </Link>
            <Link href={`/projects/${id}/renderings`}>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Image className="h-3 w-3" /> Generate Rendering
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
