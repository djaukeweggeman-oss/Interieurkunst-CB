import createMollieClient from "@mollie/api-client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminRole } from "@/lib/admin-auth";
import { logServerError } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ id: string }> };
const schema = z.object({ confirmation: z.string().min(1).max(80) });

export async function POST(request: Request, { params }: Context) {
  if (!await requireAdminRole()) return Response.json({ message: "Alleen een beheerder kan terugbetalen." }, { status: 403 });
  const id = z.uuid().safeParse((await params).id);
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!id.success || !body.success) return Response.json({ message: "Ongeldige terugbetaling." }, { status: 400 });
  const supabase = createAdminClient();
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!supabase || !apiKey) return Response.json({ message: "Mollie is niet geconfigureerd." }, { status: 503 });
  const order = await supabase.from("orders").select("order_number,mollie_payment_id,total_cents,currency,payment_status").eq("id", id.data).maybeSingle();
  if (!order.data) return Response.json({ message: "Bestelling niet gevonden." }, { status: 404 });
  if (body.data.confirmation !== order.data.order_number) return Response.json({ message: "Het ordernummer komt niet overeen." }, { status: 400 });
  if (order.data.payment_status !== "paid" || !order.data.mollie_payment_id) return Response.json({ message: "Alleen een betaalde bestelling kan worden terugbetaald." }, { status: 409 });

  try {
    await createMollieClient({ apiKey }).paymentRefunds.create({
      paymentId: order.data.mollie_payment_id,
      amount: { currency: "EUR", value: (order.data.total_cents / 100).toFixed(2) },
      description: `Terugbetaling ${order.data.order_number}`,
      metadata: { order_id: id.data, order_number: order.data.order_number },
      idempotencyKey: `refund-${id.data}`,
    });
    const now = new Date().toISOString();
    const result = await supabase.from("orders").update({ status: "refunded", payment_status: "refunded", refunded_at: now }).eq("id", id.data);
    if (result.error) throw result.error;
    revalidatePath("/admin/bestellingen"); revalidatePath(`/admin/bestellingen/${id.data}`);
    return Response.json({ ok: true });
  } catch (error) {
    logServerError("mollie-refund", error);
    return Response.json({ message: "Mollie heeft de terugbetaling niet bevestigd. Controleer het Mollie-dashboard." }, { status: 502 });
  }
}
