# SurpriseSell — Learn IoT. Build. Buy. Rent.

> Learn. Build. Buy. Rent. — formerly the IoT Lab university MVP, now a public
> platform for individuals and students at surprisesell.com.

Public signup, Virtual Lab courses, kit shop, Stripe checkout, and **mail rentals**
with shipping/return logistics. University remote-lab features remain available
for demo tenants.

## What's implemented

| Area | Status |
|---|---|
| Landing + SurpriseSell branding | Full |
| Public signup (auto-enroll IoT Foundations) | Full |
| Auth (credentials, RBAC) | Full |
| Student courses / Virtual Lab / assignments / projects | Full |
| Shop (buy + rent catalog) | Full |
| Stripe Checkout + webhook fulfillment | Full (needs Stripe keys) |
| Mail rental tracking + admin fulfillment | Full |
| Shipping addresses | Full |
| Remote lab device reservation | Full (university demo) |
| AWS IoT / Cognito / live camera | Interfaces only |

## Local setup

```bash
npm install
cp .env.example .env
# Set DATABASE_URL, AUTH_SECRET; optionally Stripe keys

npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Visit `http://localhost:3000`.

- Sign up at `/signup` (public SurpriseSell tenant)
- Shop at `/shop`
- Demo password for seeded accounts: `Password123!`
  - `student1@example.edu`, `instructor1@example.edu`, `uadmin@example.edu`, `admin@iotlab.dev`

## Production deploy (surprisesell.com)

See **[docs/deploy-surprisesell.md](docs/deploy-surprisesell.md)** — Neon + Vercel + GoDaddy DNS + Stripe webhook.

## Architecture

```
Browser (Next.js)
  |-- Auth / signup → SurpriseSell tenant (STUDENT)
  |-- Virtual Lab + courses (Prisma)
  |-- Shop → Stripe Checkout → webhook → Order / Rental / stock
  `-- Admin fulfillment (manual tracking for mail kits)
```

More: `docs/database-schema.md`, `docs/api.md`, `docs/aws-deployment.md`, `docs/security.md`.

## Limitations

- Virtual Lab does not compile arbitrary C++ on the server.
- IoT dashboard telemetry is simulated until AWS IoT Core is wired.
- Carrier labels are manual (admin enters tracking); Shippo/EasyPost is future work.
- Stripe must be configured (`STRIPE_*`) before real payments work.
