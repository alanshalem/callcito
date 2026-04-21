//#region Imports
import { adminGetUsers } from "@/actions/admin";
import ToggleAdminButton from "./_components/ToggleAdminButton";
//#endregion

export const dynamic = "force-dynamic";

//#region Admin Users
export default async function AdminUsersPage() {
  const users = await adminGetUsers();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6">Users</h1>
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Companies</th>
              <th className="text-center p-3">Admin</th>
              <th className="text-left p-3">Creado</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.name}</td>
                <td className="p-3 text-xs">
                  {u.memberships.map((m) => m.company.name).join(", ") || "—"}
                </td>
                <td className="p-3 text-center">
                  {u.isAdmin ? (
                    <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary">
                      ADMIN
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <ToggleAdminButton userId={u.id} isAdmin={u.isAdmin} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
//#endregion
