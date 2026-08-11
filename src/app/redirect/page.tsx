import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RedirectPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  switch (session.user.role) {
    case "STUDENT":
      redirect("/student");
    case "INSTRUCTOR":
      redirect("/instructor");
    case "UNIVERSITY_ADMIN":
    case "PLATFORM_ADMIN":
      redirect("/admin");
    default:
      redirect("/login");
  }
}
