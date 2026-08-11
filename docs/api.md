# API Documentation

All routes are Next.js Route Handlers under `src/app/api/`. Auth is enforced
per-route via `auth()` (NextAuth session) — see `src/lib/auth.ts`.

## POST /api/submissions
Create and auto-grade a student's assignment submission.

Auth: STUDENT only.

Request body:
```json
{
  "assignmentId": "string",
  "circuitJson": { "components": [...], "connections": [...] },
  "code": "string",
  "documentation": "string (optional)"
}
```

Response:
```json
{ "submission": { ... }, "grade": { "score": 90, "maxScore": 100, "breakdown": [...] } }
```

Grading is deterministic and rule-based (`src/lib/grading.ts`) — no AI/LLM
is in the grading loop, per spec section 17.

## POST /api/reservations
Reserve a physical device for 30 minutes (configurable via `minutes`).

Auth: STUDENT only.

Request body: `{ "deviceId": "string", "minutes": 30 }`

Enforces single-occupancy locking via a Prisma transaction that re-checks
device status before committing the reservation. Returns `409` with
`{"error": "Device is no longer available."}` if another student won the
race.

## PATCH /api/reservations
End an active reservation early (or when the countdown reaches zero, this
should be called by a scheduled job / cron in production — the MVP calls it
from the "End Experiment" button).

Auth: the reservation's owning student.

Request body: `{ "reservationId": "string" }`

Effect: reservation -> COMPLETED, device -> AVAILABLE (section 12: stop
device, clear credentials, reset, return to pool — device reset/credential
clearing is a production IoTBroker responsibility, stubbed here).

## POST /api/projects
Create a portfolio project.

Auth: STUDENT only.

Request body: `{ "name": "string", "description": "string", "visibility": "PRIVATE" | "COURSE_ONLY" | "PUBLIC" }`

## Auth routes
`/api/auth/[...nextauth]` — handled entirely by NextAuth (sign in, sign out,
session, CSRF token endpoints). Not called directly; use `signIn()` /
`signOut()` from `next-auth/react` or the `auth()` server helper.

## Not yet implemented (documented gaps)
- Instructor-facing POST endpoints for creating Course/Experiment/Assignment
  (data model exists; UI + routes are the next increment — see README roadmap).
- `/api/telemetry` ingestion endpoint for real device data (currently mocked
  client-side in the IoT Dashboard; production would have IoT Core invoke a
  Lambda that POSTs into this endpoint, or write directly to
  `DeviceTelemetry` from the Lambda).
