import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, PageHeader } from "@/components/ui/primitives";

export default async function InstructorCoursesPage() {
  const session = await auth();
  const courses = await prisma.course.findMany({
    where: { instructorId: session!.user.id },
    include: { enrollments: true, experiments: true, assignments: true },
  });

  return (
    <div>
      <PageHeader title="Courses" subtitle="Courses, experiments, and assignments you manage." />
      <div className="space-y-4">
        {courses.map((c) => (
          <Card key={c.id}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{c.difficulty} · {c.enrollments.length} students</p>
              </div>
              <div className="flex gap-2">
                <Badge>{c.experiments.length} experiments</Badge>
                <Badge>{c.assignments.length} assignments</Badge>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-400">{c.description}</p>
          </Card>
        ))}
        {courses.length === 0 && <p className="text-sm text-slate-500">You haven't created any courses yet.</p>}
      </div>
    </div>
  );
}
