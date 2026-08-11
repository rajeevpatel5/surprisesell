import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, PageHeader } from "@/components/ui/primitives";

export default async function InstructorSubmissionsPage() {
  const session = await auth();
  const submissions = await prisma.submission.findMany({
    where: { assignment: { course: { instructorId: session!.user.id } } },
    include: { student: true, assignment: true, grade: true },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Submissions" subtitle="Review and grade student work." />
      <Card>
        <div className="divide-y divide-slate-800">
          {submissions.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-slate-200">
                  {s.student.firstName} {s.student.lastName}
                </p>
                <p className="text-xs text-slate-500">{s.assignment.title}</p>
              </div>
              <Badge tone={s.status === "GRADED" ? "success" : "default"}>
                {s.grade ? `${s.grade.score}/${s.grade.maxScore}` : s.status}
              </Badge>
            </div>
          ))}
          {submissions.length === 0 && <p className="text-sm text-slate-500 py-2">No submissions yet.</p>}
        </div>
      </Card>
    </div>
  );
}
