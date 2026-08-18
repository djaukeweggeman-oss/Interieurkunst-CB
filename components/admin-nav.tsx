"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const links = [
  ["/admin", "Collectie"],
  ["/admin/bestellingen", "Bestellingen"],
  ["/admin/aanvragen", "Aanvragen"],
] as const;

export function AdminNav({ email, role }: { email: string | null; role: "admin" | "editor" }) {
  const pathname = usePathname();
  const router = useRouter();
  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }
  return <nav className="admin-nav" aria-label="Beheernavigatie">
    <div>{links.map(([href, label]) => <Link className={pathname === href || (href !== "/admin" && pathname.startsWith(href)) ? "is-active" : ""} href={href} key={href}>{label}</Link>)}</div>
    <div><span>{email ?? role} · {role}</span><button type="button" onClick={signOut}>Uitloggen</button></div>
  </nav>;
}
