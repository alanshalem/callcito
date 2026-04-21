//#region Imports
import { requireAdmin } from "@/actions/admin";
import { UserButton } from "@clerk/nextjs";
import { BarChart3, Bot, Building2, MessagesSquare, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
//#endregion

export const dynamic = "force-dynamic";

//#region Admin Layout
// Gate server-side: si no sos admin → 404 (no leak).
// Sidebar propia, distinta de la de protectedRoutes.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/home");

  const nav = [
    { href: "/admin", label: "Overview", icon: BarChart3 },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/companies", label: "Companies", icon: Building2 },
    { href: "/admin/assistants", label: "Assistants", icon: Bot },
    { href: "/admin/conversations", label: "Conversations", icon: MessagesSquare },
  ];

  return (
    <div className="flex w-full min-h-screen">
      <aside className="w-56 border-r border-border py-6 px-3 flex flex-col gap-1">
        <div className="flex items-center gap-2 px-3 mb-6">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="font-semibold">Admin</span>
        </div>
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary text-sm"
          >
            <n.icon className="w-4 h-4" />
            {n.label}
          </Link>
        ))}
        <div className="mt-auto flex items-center gap-3 px-3 pt-6 border-t border-border">
          <UserButton />
          <div className="text-xs">
            <div className="font-medium">{admin.name}</div>
            <div className="text-muted-foreground">{admin.email}</div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
//#endregion
