"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function AdminLoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const client = createBrowserSupabaseClient();
    if (!client) { setMessage("Supabase is nog niet gekoppeld."); setLoading(false); return; }
    const { error } = await client.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    if (error) { setMessage("Inloggen is niet gelukt. Controleer je gegevens."); setLoading(false); return; }
    router.replace("/admin"); router.refresh();
  }
  return <form className="admin-login-form" onSubmit={submit}><label>E-mailadres<input name="email" type="email" autoComplete="email" required /></label><label>Wachtwoord<input name="password" type="password" autoComplete="current-password" required /></label><button className="button button-dark button-wide" type="submit" disabled={loading}>{loading ? "Inloggen…" : "Veilig inloggen ↗"}</button>{message && <p className="form-message is-error" role="alert">{message}</p>}</form>;
}

