import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, PageHeader } from "@/components/ui/primitives";
import Link from "next/link";

export default async function StudentAssignmentsPage() {
  const session = await auth();
  const assignments = await prisma.assignment.findMany({
    where: { course: { enrollments: { some: { studentId: session!.user.id } } } },
    include: {
      course: true,
      submissions: { where: { studentId: session!.user.id }, include: { grade: true } },
    },
    orderBy: { deadline: "asc" },
  });

  return (
    <div>
      <PageHeader title="Assignments" subtitle="Submit your work and see grading feedback." />
      <div className="space-y-3">
        {assignments.map((a) => {
          const submission = a.submissions[0];
          return (
            <Link key={a.id} href={`/student/assignments/${a.id}`}>
              <Card className="hover:border-slate-600 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{a.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {a.course.name} · Due {a.deadline.toLocaleDateString()}
                    </p>
                  </div>
                  {submission ? (
                    <Badge tone={submission.status === "GRADED" ? "success" : "default"}>
                      {submission.grade ? `${submission.grade.score}/${submission.grade.maxScore}` : submission.status}
                    </Badge>
                  ) : (
                    <Badge tone="warning">Not submitted</Badge>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
        {assignments.length === 0 && <p className="text-sm text-slate-500">No assignments yet.</p>}
      </div>
    </div>
  );
}
