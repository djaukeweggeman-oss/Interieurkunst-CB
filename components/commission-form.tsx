"use client";

import { useState } from "react";

export function CommissionForm() {
  const [state, setState] = useState<{ loading?: boolean; message?: string; ok?: boolean }>({});
  const [startedAt, setStartedAt] = useState(0);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true });
    const form = event.currentTarget;
    const body = new FormData(form);
    try {
      const response = await fetch("/api/commission-requests", { method: "POST", body });
      const result = await response.json() as { message?: string; duplicate?: boolean };
      if (!response.ok) throw new Error(result.message ?? "Versturen is niet gelukt.");
      form.reset();
      setState({ ok: true, message: result.duplicate ? "Deze aanvraag was al veilig ontvangen." : "Dank je. Je aanvraag is veilig ontvangen; Carolien neemt contact met je op." });
    } catch (error) {
      setState({ ok: false, message: error instanceof Error ? error.message : "Er ging iets mis. Probeer het opnieuw." });
    }
  }

  return (
    <form className="editorial-form" onSubmit={submit} onFocusCapture={() => setStartedAt((current) => current || Date.now())}>
      <input type="hidden" name="startedAt" value={startedAt} />
      <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="form-grid"><label>Naam *<input name="name" autoComplete="name" required minLength={2} /></label><label>E-mailadres *<input name="email" type="email" autoComplete="email" required /></label></div>
      <div className="form-grid"><label>Telefoonnummer<input name="phone" type="tel" autoComplete="tel" /></label><label>Soort opdracht *<select name="commissionType" required defaultValue=""><option value="" disabled>Maak een keuze</option><option>Portret</option><option>Huisdier</option><option>Abstract werk</option><option>Anders</option></select></label></div>
      <div className="form-grid"><label>Gewenst formaat<input name="preferredSize" placeholder="Bijvoorbeeld 80 × 100 cm" /></label><label>Gewenste datum<input name="desiredDate" type="date" /></label></div>
      <label>Stijl<textarea name="preferredStyle" rows={3} placeholder="Welke sfeer of stijl past bij jou?" /></label>
      <label>Kleuren<textarea name="preferredColours" rows={2} placeholder="Welke kleuren mogen terugkomen?" /></label>
      <label>Toelichting *<textarea name="message" rows={6} required minLength={20} placeholder="Vertel iets over het beeld of verhaal dat je wilt laten schilderen." /></label>
      <label>Referentiefoto (optioneel)<input name="referenceImage" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      <p className="form-privacy">Referentiefoto&apos;s worden privé opgeslagen, metadata wordt verwijderd en alleen geautoriseerde beheerders kunnen ze tijdelijk openen. Maximaal 8 MB.</p>
      <button className="button button-dark" type="submit" disabled={state.loading}>{state.loading ? "Even versturen…" : "Aanvraag versturen ↗"}</button>
      {state.message && <p className={`form-message ${state.ok ? "is-success" : "is-error"}`} role="status">{state.message}</p>}
    </form>
  );
}
