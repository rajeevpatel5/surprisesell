import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeSubmission, TEMPERATURE_EXPERIMENT_CRITERIA, type GradingCriterion } from "@/lib/grading";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json();
  const { assignmentId, circuitJson, code, documentation } = body as {
    assignmentId: string;
    circuitJson: { components: { type: string; id: string }[]; connections: { fromComponentId: string; toComponentId: string }[] };
    code: string;
    documentation?: string;
  };

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const submission = await prisma.submission.create({
    data: {
      studentId: session.user.id,
      assignmentId,
      experimentId: assignment.experimentId,
      code,
      circuitJson,
      status: "SUBMITTED",
    },
  });

  // MVP: reuse the seeded Temperature Monitoring rubric when it matches;
  // otherwise fall back to a simple component/connection presence check.
  const criteria: GradingCriterion[] = assignment.title.includes("Temperature")
    ? TEMPERATURE_EXPERIMENT_CRITERIA
    : [
        { label: "Circuit has components", points: 40, check: { kind: "COMPONENT_PRESENT", componentType: "ESP32" } },
        { label: "Code submitted", points: 30, check: { kind: "CODE_CONTAINS", needle: "" } },
        { label: "Documentation provided", points: 30, check: { kind: "DOCUMENTATION_MIN_LENGTH", minLength: 1 } },
      ];

  const result = gradeSubmission({ criteria, circuit: circuitJson, code, documentation });

  const grade = await prisma.grade.create({
    data: {
      submissionId: submission.id,
      score: result.score,
      maxScore: result.maxScore,
      breakdown: result.breakdown,
      gradedById: session.user.id, // auto-graded; MVP attributes to the system via the submitting user
    },
  });

  await prisma.submission.update({ where: { id: submission.id }, data: { status: "GRADED" } });

  return NextResponse.json({ submission, grade });
}
