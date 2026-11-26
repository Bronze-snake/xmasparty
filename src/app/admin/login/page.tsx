import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function AdminLogin() {
  if (await isAdmin()) redirect("/admin");
  return (
    <section className="section" style={{ borderBottom: 0, flex: 1, maxWidth: 480, width: "100%", margin: "0 auto" }}>
      <span className="eyebrow">Organisers only</span>
      <h1 className="display">Admin</h1>
      <LoginForm />
    </section>
  );
}
