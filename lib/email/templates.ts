import type { EmailEventType } from "@/lib/email/service";

export type EmailTemplate = { subject: string; text: string };

export function renderEmailTemplate(type: EmailEventType, context: { orderNumber?: string; name?: string }) : EmailTemplate {
  const orderNumber = context.orderNumber ?? "je bestelling";
  const name = context.name ? ` ${context.name}` : "";
  switch (type) {
    case "order_received":
      return { subject: `Bestelling ${orderNumber} ontvangen`, text: `Beste${name},\n\nJe bestelling is ontvangen. De betaalstatus wordt veilig via Mollie gecontroleerd.\n\nHartelijke groet,\nCarolien Ballast` };
    case "payment_confirmed":
      return { subject: `Betaling ${orderNumber} bevestigd`, text: `Beste${name},\n\nDe betaling voor ${orderNumber} is bevestigd. Carolien neemt de bestelling in behandeling.\n\nHartelijke groet,\nCarolien Ballast` };
    case "order_shipped":
      return { subject: `${orderNumber} is verzonden`, text: `Beste${name},\n\nJe kunstwerk is verzonden. Eventuele bezorginformatie volgt volgens de gemaakte afspraak.\n\nHartelijke groet,\nCarolien Ballast` };
    case "new_order_admin":
      return { subject: `Nieuwe bestelling ${orderNumber}`, text: `Er staat een nieuwe bestelling klaar in het beveiligde beheer van Interieurkunst CB.` };
    case "new_contact_request":
      return { subject: "Nieuwe contactaanvraag", text: "Er staat een nieuwe contactaanvraag klaar in het beveiligde beheer van Interieurkunst CB." };
    case "new_commission_request":
      return { subject: "Nieuwe opdrachtaanvraag", text: "Er staat een nieuwe aanvraag voor kunst in opdracht klaar in het beveiligde beheer van Interieurkunst CB." };
  }
}
