import { isAdmin } from "@/lib/auth";
import { AdminNav } from "./nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <main className="shell wide" style={{ maxWidth: 720 }}>
      {admin && <AdminNav />}
      {children}
    </main>
  );
}
