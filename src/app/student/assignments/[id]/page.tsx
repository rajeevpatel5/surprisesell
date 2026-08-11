import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge } from "@/components/ui/primitives";
import { AssignmentWorkspace } from "@/components/lab/assignment-workspace";
import { notFound } from "next/navigation";

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      course: true,
      submissions: { where: { studentId: session!.user.id }, include: { grade: true } },
    },
  });
  if (!assignment) notFound();

  const submission = assignment.submissions[0];

  return (
    <div>
      <PageHeader title={assignment.title} subtitle={assignment.course.name} />

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">Instructions</p>
          <Badge tone="warning">Due {assignment.deadline.toLocaleDateString()}</Badge>
        </div>
        <p className="text-sm text-slate-300">{assignment.instructions}</p>
        <p className="mt-3 text-xs text-slate-500">
          Required components: {assignment.requiredComponents.join(", ")}
        </p>
        {submission && (
          <p className="mt-2 text-xs text-slate-500">
            Last submission: {submission.status}
            {submission.grade ? ` — ${submission.grade.score}/${submission.grade.maxScore}` : ""}
          </p>
        )}
      </Card>

      <AssignmentWorkspace assignmentId={assignment.id} />
    </div>
  );
}
