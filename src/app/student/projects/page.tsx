import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, PageHeader } from "@/components/ui/primitives";
import { NewProjectForm } from "@/components/lab/new-project-form";

export default async function StudentProjectsPage() {
  const session = await auth();
  const projects = await prisma.project.findMany({
    where: { studentId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Projects" subtitle="Your portfolio of IoT builds." />
      <div className="mb-4"><NewProjectForm /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        {projects.map((p) => (
          <Card key={p.id}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{p.name}</h3>
              <Badge tone={p.visibility === "PUBLIC" ? "success" : "default"}>{p.visibility.replace("_", " ")}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">{p.description || "No description yet."}</p>
          </Card>
        ))}
        {projects.length === 0 && <p className="text-sm text-slate-500">No projects yet — create your first one.</p>}
      </div>
    </div>
  );
}
