"use client";

import { useState } from "react";
import type { Json } from "@/lib/supabase/database.types";

type Setting = { key: string; value: Json; is_public: boolean };

export function AdminSettings({ settings }: { settings: Setting[] }) {
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>, setting: Setting) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let value: unknown;
    try { value = JSON.parse(String(form.get("value"))); }
    catch { setMessage("De JSON-inhoud is niet geldig."); return; }
    const response = await fetch(`/api/admin/settings/${encodeURIComponent(setting.key)}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ value, isPublic: form.get("isPublic") === "on" }),
    });
    const result = await response.json().catch(() => ({})) as { message?: string };
    setMessage(response.ok ? "Instelling opgeslagen." : result.message ?? "Opslaan is niet gelukt.");
  }
  return <section className="admin-settings">{message && <p className="form-message" role="status">{message}</p>}{settings.map((setting) => <form key={setting.key} onSubmit={(event) => void submit(event, setting)}><div><p className="eyebrow">{setting.key}</p><label><input name="isPublic" type="checkbox" defaultChecked={setting.is_public} disabled={setting.key === "checkout.reservation"} /> Publiek leesbaar</label></div><textarea name="value" rows={6} defaultValue={JSON.stringify(setting.value, null, 2)} spellCheck={false} /><button className="button button-dark" type="submit">Opslaan</button></form>)}</section>;
}
