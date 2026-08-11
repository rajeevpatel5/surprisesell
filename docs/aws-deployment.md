# AWS Deployment Guide

This MVP runs entirely without AWS (local Postgres + local auth). This doc
describes the production path to AWS. No account IDs, regions, or secrets
are hard-coded anywhere in the app — everything below is environment-driven.

## 1. Local development
See the root `README.md` — `npm install`, `.env`, `npx prisma migrate dev`,
`npm run dev`.

## 2. PostgreSQL (Amazon RDS)
- Provision an RDS PostgreSQL instance (Multi-AZ for production).
- Set `DATABASE_URL` to the RDS connection string.
- Run `npx prisma migrate deploy` against it from a CI/CD job.

## 3. Cognito
- Create a Cognito User Pool with four groups: `Student`, `Instructor`,
  `UniversityAdmin`, `PlatformAdmin`.
- Create an app client (no client secret if using PKCE from the browser;
  with secret if the Next.js server exchanges the code).
- Set `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET`,
  `AWS_REGION`.
- Swap the Credentials provider in `src/lib/auth.ts` for NextAuth's Cognito
  provider (or a custom OIDC provider). Keep the `session.jwt`/`session`
  callbacks — they already read `role` and `universityId`, which should be
  populated from Cognito custom attributes (`custom:role`,
  `custom:universityId`) set at user creation.

## 4. IoT Core
- Create an IoT Core endpoint (`AWS_IOT_ENDPOINT`).
- For each physical device, create a "thing", an X.509 certificate, and an
  IoT policy scoped to only that device's three topics (see
  `src/lib/mqtt-topics.ts`).
- Implement `IoTBroker` (same file) against the AWS IoT SDK, replacing
  `MockBroker`, in a server-only module (never bundle IoT credentials into
  client code).
- Provision `AWS_IOT_ROLE_ARN` for the backend's cross-service role.

## 5. S3 + CloudFront
- One bucket (`AWS_S3_BUCKET`) for circuit snapshots, project screenshots,
  and uploaded firmware.
- Front it with CloudFront (`AWS_CLOUDFRONT_DOMAIN`) for cached delivery of
  public project portfolio assets.

## 6. Lambda (optional)
- `AWS_LAMBDA_GRADING_FN`: offload the rule-based grading engine
  (`src/lib/grading.ts`) to a Lambda if grading volume grows past what the
  Next.js server should handle inline. The grading function is already pure
  and dependency-light, so this is a near-direct lift.

## 7. Live video
- `LIVE_VIDEO_STREAM_PROVIDER=kinesis-video` or `ivs`. Both support
  WebRTC/HLS playback that can replace the placeholder in
  `src/app/student/devices/page.tsx`.

## 8. Infrastructure as code
Prefer AWS CDK (TypeScript, matches the rest of the stack) or Terraform.
Suggested stacks:
- `NetworkStack` — VPC, subnets, security groups
- `DataStack` — RDS, S3
- `AuthStack` — Cognito User Pool + app client
- `IoTStack` — IoT Core endpoint, per-device thing provisioning Lambda
- `AppStack` — hosting for the Next.js app (Amplify Hosting, or
  ECS/Fargate + ALB if you need more control), CloudFront, IAM roles

## 9. Production deployment checklist
- [ ] `AUTH_SECRET` set to a strong random value, stored in Secrets Manager
- [ ] `npx prisma migrate deploy` run against RDS
- [ ] `npx prisma db seed` run once for demo data (skip in real prod)
- [ ] Cognito provider wired into `src/lib/auth.ts`
- [ ] `IoTBroker` implemented against real IoT Core
- [ ] CloudWatch alarms on Lambda errors / RDS CPU / IoT Core connection drops
- [ ] No `.env` file committed; all secrets in Secrets Manager / SSM
