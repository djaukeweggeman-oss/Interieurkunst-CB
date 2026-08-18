"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function ContactForm() {
  const searchParams = useSearchParams();
  const artwork = searchParams.get("werk") ?? "";
  const [state, setState] = useState<{ loading?: boolean; message?: string; ok?: boolean }>({});
  const [startedAt, setStartedAt] = useState(0);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true });
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) });
      const result = await response.json() as { message?: string; demo?: boolean };
      if (!response.ok) throw new Error(result.message ?? "Versturen is niet gelukt.");
      form.reset();
      setState({ ok: true, message: result.demo ? "Je bericht is lokaal getest. Koppel Supabase/e-mail om het werkelijk te ontvangen." : "Dank je. Je bericht is ontvangen." });
    } catch (error) { setState({ ok: false, message: error instanceof Error ? error.message : "Er ging iets mis." }); }
  }
  return <form className="editorial-form" onSubmit={submit} onFocusCapture={() => setStartedAt((current) => current || Date.now())}>
    <input type="hidden" name="startedAt" value={startedAt} /><div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <div className="form-grid"><label>Naam *<input name="name" autoComplete="name" required /></label><label>E-mailadres *<input name="email" type="email" autoComplete="email" required /></label></div>
    <label>Waar gaat je vraag over? *<select name="subject" required defaultValue={artwork ? `Vraag over ${artwork}` : ""}><option value="" disabled>Maak een keuze</option>{artwork && <option>{`Vraag over ${artwork}`}</option>}<option>Een kunstwerk</option><option>Bezorging of afhalen</option><option>Kunst in opdracht</option><option>Anders</option></select></label>
    <label>Bericht *<textarea name="message" rows={7} minLength={10} required /></label>
    <p className="form-privacy">Je gegevens worden alleen gebruikt om je vraag te beantwoorden. Lees meer in de privacyverklaring.</p>
    <button className="button button-dark" type="submit" disabled={state.loading}>{state.loading ? "Even versturen…" : "Bericht versturen ↗"}</button>
    {state.message && <p className={`form-message ${state.ok ? "is-success" : "is-error"}`} role="status">{state.message}</p>}
  </form>;
}
