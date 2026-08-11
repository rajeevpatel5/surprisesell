import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, ProgressBar, PageHeader } from "@/components/ui/primitives";

export default async function StudentCoursesPage() {
  const session = await auth();
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session!.user.id },
    include: { course: { include: { instructor: true } } },
  });

  return (
    <div>
      <PageHeader title="My Courses" subtitle="Everything you're enrolled in this term." />
      <div className="grid sm:grid-cols-2 gap-4">
        {enrollments.map((e) => (
          <Card key={e.id}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">{e.course.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {e.course.difficulty} · {e.course.instructor.firstName} {e.course.instructor.lastName}
                </p>
              </div>
              <span className="text-xs text-slate-400">{e.progress}%</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">{e.course.description}</p>
            <div className="mt-3">
              <ProgressBar value={e.progress} />
            </div>
          </Card>
        ))}
        {enrollments.length === 0 && <p className="text-sm text-slate-500">No courses yet.</p>}
      </div>
    </div>
  );
}
