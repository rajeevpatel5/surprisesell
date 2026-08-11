# Database Schema

Full source of truth: `prisma/schema.prisma`. Summary of the core entities:

- **University** — tenant root. `status`: ACTIVE / SUSPENDED / TRIAL.
- **Department** — belongs to a University.
- **User** — `role` enum (STUDENT / INSTRUCTOR / UNIVERSITY_ADMIN /
  PLATFORM_ADMIN), optionally scoped to a University (platform admins have
  `universityId = null`).
- **Course** — belongs to a University + Department, taught by one Instructor.
- **Enrollment** — join table, Student <-> Course, tracks `progress` (0-100).
- **Experiment** — instructor-authored, belongs to a Course.
- **Assignment** — belongs to a Course, optionally linked to an Experiment,
  carries `gradingCriteria` as JSON.
- **Submission** — a Student's attempt at an Assignment; stores the
  submitted `code` and `circuitJson` (serialized Virtual Lab graph).
- **Grade** — 1:1 with Submission; stores `score`, `maxScore`, and a JSON
  `breakdown` of which rubric criteria passed.
- **Project** — student portfolio item; `visibility`: PRIVATE / COURSE_ONLY
  / PUBLIC.
- **Dashboard** / **DashboardWidget** — student-configurable IoT dashboards.
- **Simulation** / **SimulationComponent** / **SimulationConnection** —
  persisted Virtual Lab circuits (separate from the ephemeral in-editor
  state, for save/load).
- **Device** — physical ESP32 (or future hardware), belongs to a University.
  `status`: AVAILABLE / RESERVED / RUNNING / OFFLINE / MAINTENANCE.
- **DeviceReservation** — Student <-> Device booking window; `status`:
  ACTIVE / COMPLETED / CANCELLED / EXPIRED.
- **DeviceTelemetry** — raw telemetry payloads received from a device,
  timestamped.
- **Subscription** — 1:1 with University; plan/seats/billing status.
- **AuditLog** — action log, optionally scoped to a University and/or User.

## Multi-tenancy rule
Every query that returns tenant data must filter by `universityId` taken
from the authenticated session — never from client input. Platform Admin
routes are the sole, explicit exception (see `src/app/admin/**`), and are
themselves gated by `session.user.role === "PLATFORM_ADMIN"` in middleware
and again in the page itself (defense in depth).
