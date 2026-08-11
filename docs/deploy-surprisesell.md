# Deploying SurpriseSell to surprisesell.com

This app is a Next.js 16 + Prisma + Postgres platform. Host the app on **Vercel**,
the database on **Neon**, payments on **Stripe**, and point **GoDaddy DNS** at Vercel.

## 1. Neon Postgres

1. Create a project at https://neon.tech
2. Copy the connection string into `DATABASE_URL`
3. Locally (or in CI):

```bash
npx prisma migrate deploy
npx prisma db seed
```

## 2. Vercel

1. Push this repository to GitHub
2. Import the repo in https://vercel.com
3. Set environment variables:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://surprisesell.com` |
| `STRIPE_SECRET_KEY` | Stripe secret (test, then live) |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook endpoint |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

4. Deploy. Confirm `https://<project>.vercel.app` boots.

## 3. Domain on GoDaddy → Vercel

1. In Vercel → Project → Settings → Domains → add `surprisesell.com` and `www.surprisesell.com`
2. In GoDaddy DNS for surprisesell.com, apply the records Vercel shows (typically):
   - **A** `@` → Vercel IP
   - **CNAME** `www` → `cname.vercel-dns.com`
3. Wait for DNS/SSL (often minutes; can take up to 48h)

## 4. Stripe webhook

1. Stripe Dashboard → Developers → Webhooks
2. Endpoint URL: `https://surprisesell.com/api/webhooks/stripe`
3. Event: `checkout.session.completed`
4. Copy signing secret into `STRIPE_WEBHOOK_SECRET` on Vercel and redeploy

## 5. Smoke test

1. Open https://surprisesell.com → Sign up
2. Confirm auto-enroll in **IoT Foundations** under Courses
3. Open Virtual Lab
4. Add address under Addresses
5. Buy or rent a kit → Stripe Checkout (test card `4242…`)
6. Admin (`admin@iotlab.dev`) → Fulfillment → mark shipped with tracking
7. Renter → Mark return shipped → Admin confirms return & deposit release

## Notes

- Keep **Prisma 6** until a dedicated Prisma 7 migration.
- Local Docker Postgres remains fine for development; production must use Neon (or similar).
- Switch Stripe keys from test → live only after end-to-end test succeeds.
