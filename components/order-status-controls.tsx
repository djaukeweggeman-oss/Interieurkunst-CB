"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrderStatusControls({ id, orderNumber, status, paymentStatus, canRefund }: {
  id: string; orderNumber: string; status: string; paymentStatus: string; canRefund: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function changeStatus(next: string) {
    if (next === "cancelled" && !window.confirm("Deze onbetaalde bestelling annuleren en de reservering vrijgeven?")) return;
    setLoading(true); setMessage("");
    const response = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next }) });
    const result = await response.json().catch(() => ({})) as { message?: string };
    setLoading(false); setMessage(response.ok ? "De status is bijgewerkt." : result.message ?? "Bijwerken is niet gelukt.");
    if (response.ok) router.refresh();
  }
  async function refund() {
    const confirmation = window.prompt(`Typ ${orderNumber} om de volledige terugbetaling via Mollie te bevestigen.`);
    if (!confirmation) return;
    setLoading(true); setMessage("");
    const response = await fetch(`/api/admin/orders/${id}/refund`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirmation }) });
    const result = await response.json().catch(() => ({})) as { message?: string };
    setLoading(false); setMessage(response.ok ? "De terugbetaling is bij Mollie aangevraagd." : result.message ?? "Terugbetalen is niet gelukt.");
    if (response.ok) router.refresh();
  }
  return <div className="order-controls"><p className="eyebrow">Status bijwerken</p><div>
    {status === "paid" && <button disabled={loading} onClick={() => changeStatus("processing")} type="button">In behandeling nemen</button>}
    {status === "processing" && <button disabled={loading} onClick={() => changeStatus("shipped")} type="button">Markeer als verzonden</button>}
    {status === "shipped" && <button disabled={loading} onClick={() => changeStatus("completed")} type="button">Bestelling afronden</button>}
    {["pending", "awaiting_payment"].includes(status) && <button className="is-danger" disabled={loading} onClick={() => changeStatus("cancelled")} type="button">Annuleren</button>}
    {canRefund && paymentStatus === "paid" && <button className="is-danger" disabled={loading} onClick={refund} type="button">Volledig terugbetalen</button>}
  </div>{message && <p className="form-message" role="status">{message}</p>}</div>;
}
