import { SimulationEngine, ACTUATOR_TYPES } from "@/lib/simulation-engine";

export interface GradingCriterion {
  label: string;
  points: number;
  check:
    | { kind: "COMPONENT_PRESENT"; componentType: string }
    | { kind: "CONNECTION_EXISTS"; fromType: string; toType: string }
    | { kind: "CODE_CONTAINS"; needle: string }
    | { kind: "DOCUMENTATION_MIN_LENGTH"; minLength: number };
}

export interface GradingResult {
  score: number;
  maxScore: number;
  breakdown: { label: string; points: number; earned: number; passed: boolean }[];
}

/**
 * Deterministic, explainable grading — no LLM/AI in the loop for the MVP.
 * Each criterion maps to a concrete, checkable fact about the submission
 * (circuit graph, submitted code, or documentation), matching section 17.
 */
export function gradeSubmission(params: {
  criteria: GradingCriterion[];
  circuit?: { components: { type: string }[]; connections: { fromComponentId: string; toComponentId: string }[] };
  code?: string;
  documentation?: string;
}): GradingResult {
  const { criteria, circuit, code = "", documentation = "" } = params;
  const breakdown = criteria.map((criterion) => {
    let passed = false;

    switch (criterion.check.kind) {
      case "COMPONENT_PRESENT":
        passed = !!circuit?.components.some(
          (c) => c.type === (criterion.check as any).componentType
        );
        break;
      case "CONNECTION_EXISTS": {
        if (!circuit) break;
        const { fromType, toType } = criterion.check as any;
        const byId = new Map(circuit.components.map((c, i) => [String(i), c.type]));
        // components in submitted circuits carry their own ids; fall back to type-based match
        passed = circuit.connections.some((conn) => {
          const from = (circuit.components as any).find((c: any) => c.id === conn.fromComponentId);
          const to = (circuit.components as any).find((c: any) => c.id === conn.toComponentId);
          return from?.type === fromType && to?.type === toType;
        });
        break;
      }
      case "CODE_CONTAINS":
        passed = code.toLowerCase().includes((criterion.check as any).needle.toLowerCase());
        break;
      case "DOCUMENTATION_MIN_LENGTH":
        passed = documentation.trim().length >= (criterion.check as any).minLength;
        break;
    }

    return {
      label: criterion.label,
      points: criterion.points,
      earned: passed ? criterion.points : 0,
      passed,
    };
  });

  const score = breakdown.reduce((sum, b) => sum + b.earned, 0);
  const maxScore = criteria.reduce((sum, c) => sum + c.points, 0);

  return { score, maxScore, breakdown };
}

/** Default criteria for the seeded "Temperature Monitoring System" experiment. */
export const TEMPERATURE_EXPERIMENT_CRITERIA: GradingCriterion[] = [
  { label: "Temperature sensor connected", points: 20, check: { kind: "COMPONENT_PRESENT", componentType: "TEMP_SENSOR" } },
  { label: "LED wired to sensor logic", points: 20, check: { kind: "CONNECTION_EXISTS", fromType: "TEMP_SENSOR", toType: "LED" } },
  { label: "Correct threshold code", points: 30, check: { kind: "CODE_CONTAINS", needle: "temperature > 30" } },
  { label: "Dashboard configured", points: 20, check: { kind: "CODE_CONTAINS", needle: "dashboard" } },
  { label: "Documentation provided", points: 10, check: { kind: "DOCUMENTATION_MIN_LENGTH", minLength: 40 } },
];

export { SimulationEngine, ACTUATOR_TYPES };
