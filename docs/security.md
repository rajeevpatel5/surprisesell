# Security

## Multi-tenant isolation
Every tenant-scoped table (`User`, `Course`, `Device`, `AuditLog`, ...) has a
`universityId` foreign key. All Prisma queries in `src/app/**` filter by the
signed-in user's `session.user.universityId` (see `src/app/admin/**` for the
platform-admin exception, which is explicitly allowed to query across
tenants). There is no query in the app that accepts a client-supplied
`universityId` — it always comes from the server-side session.

## Auth
- Passwords are hashed with bcrypt (`bcryptjs`), never stored in plain text.
- Sessions are JWT-based via NextAuth; `AUTH_SECRET` must be a strong random
  value in production.
- `src/middleware.ts` enforces role-based access to `/student`, `/instructor`,
  and `/admin` before any page code runs.
- Production auth should swap the Credentials provider for Cognito — see the
  comment block at the top of `src/lib/auth.ts`.

## Device / reservation security
- `POST /api/reservations` uses a Prisma transaction that re-checks device
  status inside the transaction before creating a reservation, preventing
  two students from concurrently reserving the same device (section 12/23).
- Device credentials/certificates are never sent to the browser — the
  `IoTBroker` interface (`src/lib/mqtt-topics.ts`) is a server-side seam;
  a student's browser never talks to AWS IoT Core directly.

## Code execution
No arbitrary student code is executed on the server. The Virtual Lab uses a
deterministic, non-Turing-complete simulation engine (threshold rules on a
component graph) instead of a compiler. If real code execution is added
later, it must run in an isolated sandbox (container/VM) with no access to
the app's database credentials or other tenants' data.

## Secrets
All AWS/Cognito/IoT configuration is read from environment variables
(`.env.example`) — nothing is hard-coded, and no AWS secret is ever sent to
the frontend bundle (only `NEXT_PUBLIC_*`-prefixed vars would be, and none
are defined).

## Still to add before production
- Rate limiting on `/api/*` routes (e.g. via an edge middleware + token
  bucket, or API Gateway usage plans if fronted by AWS API Gateway).
- Structured audit logging writes (the `AuditLog` model exists; routes don't
  yet write to it).
- CSRF protection review for any non-NextAuth POST routes.
- Input validation with `zod` schemas on all API route bodies (zod is
  installed but not yet wired into every route in this MVP).
