import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { authorizeAppRole } from "@/lib/auth-data";

export default async function WorkspacePage() {
  const session = await getServerSession(authOptions);
  const subject = session?.user?.id ?? null;

  const hasAccess = await authorizeAppRole({
    subject,
    requiredRole: "workspace:access",
    resource: "/workspace",
    action: "read",
  });

  if (!subject) {
    redirect("/api/auth/signin?callbackUrl=%2Fworkspace");
  }

  if (!hasAccess) {
    return (
      <main className="workspace-page">
        <section className="workspace-message" role="alert">
          <p className="eyebrow">ACCESS CONTROL</p>
          <h1>Access not granted</h1>
          <p>Your account is signed in, but it does not have the workspace access role.</p>
          <Link href="/">Return to Aster</Link>
        </section>
      </main>
    );
  }

  const displayName = session?.user?.name ?? session?.user?.email ?? "member";

  return (
    <main className="workspace-page">
      <section className="workspace-message">
        <p className="eyebrow">ASTER WORKSPACE</p>
        <h1>Welcome, {displayName}</h1>
        <p>Your server-side workspace access check succeeded.</p>
        <Link href="/">Back to account</Link>
      </section>
    </main>
  );
}