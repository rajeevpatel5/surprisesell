import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await req.json();
  const { name, description, visibility } = body as { name: string; description: string; visibility: "PRIVATE" | "COURSE_ONLY" | "PUBLIC" };

  if (!name?.trim()) return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      studentId: session.user.id,
      name,
      description: description ?? "",
      components: [],
      visibility: visibility ?? "PRIVATE",
    },
  });
  return NextResponse.json({ project });
}
