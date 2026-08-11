import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FOUNDATIONS_COURSE_NAME, SURPRISESELL_TENANT_SLUG } from "@/lib/tenant";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password, firstName, lastName } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
  }

  const tenant = await prisma.university.findUnique({
    where: { slug: SURPRISESELL_TENANT_SLUG },
  });
  if (!tenant) {
    return NextResponse.json(
      { error: "TENANT_MISSING", message: "SurpriseSell tenant is not seeded." },
      { status: 503 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: Role.STUDENT,
      universityId: tenant.id,
    },
  });

  const foundations = await prisma.course.findFirst({
    where: { universityId: tenant.id, name: FOUNDATIONS_COURSE_NAME },
  });
  if (foundations) {
    await prisma.enrollment.create({
      data: { studentId: user.id, courseId: foundations.id, progress: 0 },
    });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
}
