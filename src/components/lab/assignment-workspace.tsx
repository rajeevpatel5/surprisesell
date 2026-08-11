"use client";

import { useState } from "react";
import { VirtualLab } from "@/components/lab/virtual-lab";
import { Card, Badge } from "@/components/ui/primitives";
import { useRouter } from "next/navigation";

interface GradeResult {
  score: number;
  maxScore: number;
  breakdown: { label: string; points: number; earned: number; passed: boolean }[];
}

export function AssignmentWorkspace({ assignmentId }: { assignmentId: string }) {
  const [result, setResult] = useState<GradeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(payload: { circuitJson: unknown; code: string }) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          circuitJson: payload.circuitJson,
          code: payload.code,
          documentation: "Circuit built in the Virtual Lab and submitted for grading.",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult({ score: data.grade.score, maxScore: data.grade.maxScore, breakdown: data.grade.breakdown });
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <VirtualLab submitAction={handleSubmit} />
      {submitting && <p className="text-sm text-slate-500">Submitting…</p>}
      {result && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Grading Result</h3>
            <Badge tone="success">{result.score}/{result.maxScore}</Badge>
          </div>
          <div className="space-y-1.5">
            {result.breakdown.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{b.label}</span>
                <span className={b.passed ? "text-emerald-400" : "text-slate-500"}>{b.earned}/{b.points}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
