import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard, Card, PageHeader } from "@/components/ui/primitives";

export default async function InstructorOverviewPage() {
  const session = await auth();
  const instructorId = session!.user.id;

  const courses = await prisma.course.findMany({
    where: { instructorId },
    include: { enrollments: true, experiments: true, assignments: { include: { submissions: { include: { grade: true } } } } },
  });

  const studentIds = new Set(courses.flatMap((c) => c.enrollments.map((e) => e.studentId)));
  const allSubmissions = courses.flatMap((c) => c.assignments.flatMap((a) => a.submissions));
  const gradedSubmissions = allSubmissions.filter((s) => s.grade);
  const avgGrade = gradedSubmissions.length
    ? Math.round(
        (gradedSubmissions.reduce((sum, s) => sum + (s.grade!.score / s.grade!.maxScore) * 100, 0) /
          gradedSubmissions.length)
      )
    : 0;

  const devices = await prisma.device.findMany({ where: { universityId: session!.user.universityId! } });
  const utilization = devices.length
    ? Math.round((devices.filter((d) => d.status !== "AVAILABLE").length / devices.length) * 100)
    : 0;

  return (
    <div>
      <PageHeader title="Instructor Overview" subtitle="Your courses at a glance." />
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Students" value={studentIds.size} />
        <StatCard label="Courses" value={courses.length} />
        <StatCard label="Submissions Graded" value={`${gradedSubmissions.length}/${allSubmissions.length}`} />
        <StatCard label="Average Grade" value={`${avgGrade}%`} />
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-white mb-4">Lab Device Utilization</h2>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${utilization}%` }} />
          </div>
          <span className="text-xs text-slate-400">{utilization}%</span>
        </div>
      </Card>
    </div>
  );
}
