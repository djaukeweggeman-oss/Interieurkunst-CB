"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RequestItem = {
  id: string; kind: "contact" | "commission"; name: string; email: string; phone: string | null;
  subject: string; message: string; status: string; adminNotes: string | null; createdAt: string; imageUrl?: string | null;
};

const statusOptions = {
  contact: ["new", "read", "replied", "closed"],
  commission: ["new", "contacted", "in_discussion", "accepted", "declined", "completed"],
};

export function AdminRequests({ items }: { items: RequestItem[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function save(item: RequestItem, form: HTMLFormElement) {
    const values = Object.fromEntries(new FormData(form).entries());
    const response = await fetch(`/api/admin/requests/${item.kind}/${item.id}`, {
      method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(values),
    });
    const result = await response.json().catch(() => ({})) as { message?: string };
    setMessage(response.ok ? "Aanvraag bijgewerkt." : result.message ?? "Bijwerken is niet gelukt.");
    if (response.ok) router.refresh();
  }
  return <section className="admin-request-list">{message && <p className="form-message" role="status">{message}</p>}{items.length ? items.map((item) => <article className="admin-request-card" key={`${item.kind}-${item.id}`}><header><div><p className="eyebrow">{item.kind === "contact" ? "Contact" : "Kunst in opdracht"}</p><h2>{item.subject}</h2></div><span>{item.status}</span></header><div className="admin-request-body"><div><strong>{item.name}</strong><a href={`mailto:${item.email}`}>{item.email}</a>{item.phone && <a href={`tel:${item.phone}`}>{item.phone}</a>}<small>{new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</small></div><p>{item.message}</p>{item.imageUrl && <a className="text-link" href={item.imageUrl} target="_blank" rel="noreferrer">Open privé-referentiebeeld ↗</a>}</div><form onSubmit={(event) => { event.preventDefault(); void save(item, event.currentTarget); }}><label>Status<select name="status" defaultValue={item.status}>{statusOptions[item.kind].map((status) => <option key={status}>{status}</option>)}</select></label><label>Interne notities<textarea name="adminNotes" rows={3} defaultValue={item.adminNotes ?? ""} /></label><button className="button button-dark" type="submit">Opslaan</button></form></article>) : <div className="empty-state"><h2>Nog geen aanvragen</h2><p>Contact- en opdrachtaanvragen verschijnen hier.</p></div>}</section>;
}
