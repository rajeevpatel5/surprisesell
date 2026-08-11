import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, ProgressBar, Badge, PageHeader } from "@/components/ui/primitives";
import Link from "next/link";

export default async function StudentDashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [enrollments, upcomingAssignments, submissions, reservations] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: userId },
      include: { course: true },
      orderBy: { enrolledAt: "desc" },
    }),
    prisma.assignment.findMany({
      where: { course: { enrollments: { some: { studentId: userId } } }, deadline: { gt: new Date() } },
      include: { course: true },
      orderBy: { deadline: "asc" },
      take: 3,
    }),
    prisma.submission.findMany({
      where: { studentId: userId },
      include: { assignment: true, experiment: true },
      orderBy: { submittedAt: "desc" },
      take: 4,
    }),
    prisma.deviceReservation.findMany({
      where: { studentId: userId, status: "ACTIVE" },
      include: { device: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${session!.user.firstName}`}
        subtitle="Here's where your labs and coursework stand."
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Active Courses</p>
          <p className="mt-1 text-2xl font-semibold text-white">{enrollments.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Upcoming Deadlines</p>
          <p className="mt-1 text-2xl font-semibold text-white">{upcomingAssignments.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Active Lab Reservations</p>
          <p className="mt-1 text-2xl font-semibold text-white">{reservations.length}</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">My Courses</h2>
          <div className="space-y-4">
            {enrollments.length === 0 && <p className="text-sm text-slate-500">No enrollments yet.</p>}
            {enrollments.map((e) => (
              <div key={e.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-200">{e.course.name}</span>
                  <span className="text-xs text-slate-500">{e.progress}%</span>
                </div>
                <ProgressBar value={e.progress} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Upcoming</h2>
          <div className="space-y-3">
            {upcomingAssignments.length === 0 && (
              <p className="text-sm text-slate-500">Nothing due soon.</p>
            )}
            {upcomingAssignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-200">{a.title}</p>
                  <p className="text-xs text-slate-500">{a.course.name}</p>
                </div>
                <Badge tone="warning">
                  Due {a.deadline.toLocaleDateString(undefined, { weekday: "short" })}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Experiments &amp; Submissions</h2>
          <div className="space-y-3">
            {submissions.length === 0 && <p className="text-sm text-slate-500">No submissions yet.</p>}
            {submissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <p className="text-sm text-slate-200">
                  {s.assignment?.title ?? s.experiment?.name ?? "Experiment"}
                </p>
                <Badge tone={s.status === "GRADED" ? "success" : "default"}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/student/lab" className="rounded-lg bg-brand-500 hover:bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          Open Virtual Lab
        </Link>
        <Link href="/student/devices" className="rounded-lg border border-slate-700 hover:border-slate-500 px-4 py-2 text-sm font-medium text-slate-200">
          Reserve Remote Hardware
        </Link>
      </div>
    </div>
  );
}
