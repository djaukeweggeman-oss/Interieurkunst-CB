import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { emailService } from "@/lib/email/service";
import { canTransitionOrder } from "@/lib/order-rules";
import { createAdminClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ id: string }> };
const schema = z.object({ status: z.enum(["processing", "shipped", "completed", "cancelled"]) });

export async function PATCH(request: Request, { params }: Context) {
  if (!await getAdminUser()) return Response.json({ message: "Niet geautoriseerd." }, { status: 401 });
  const id = z.uuid().safeParse((await params).id);
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!id.success || !body.success) return Response.json({ message: "Ongeldige statuswijziging." }, { status: 400 });
  const supabase = createAdminClient();
  if (!supabase) return Response.json({ message: "Supabase is niet geconfigureerd." }, { status: 503 });
  const current = await supabase.from("orders").select("status,customer_email,order_number").eq("id", id.data).maybeSingle();
  if (!current.data) return Response.json({ message: "Bestelling niet gevonden." }, { status: 404 });
  if (!canTransitionOrder(current.data.status, body.data.status)) {
    return Response.json({ message: "Deze statusovergang is niet toegestaan." }, { status: 409 });
  }

  if (body.data.status === "cancelled") {
    const released = await supabase.rpc("release_order_reservation", { p_order_id: id.data });
    if (released.error) return Response.json({ message: "Annuleren is niet gelukt." }, { status: 500 });
  } else {
    const timestamp = new Date().toISOString();
    const update = {
      status: body.data.status,
      ...(body.data.status === "processing" ? { processed_at: timestamp } : {}),
      ...(body.data.status === "shipped" ? { shipped_at: timestamp } : {}),
      ...(body.data.status === "completed" ? { completed_at: timestamp } : {}),
    };
    const result = await supabase.from("orders").update(update).eq("id", id.data);
    if (result.error) return Response.json({ message: "Bijwerken is niet gelukt." }, { status: 500 });
    if (body.data.status === "shipped") await emailService.queue({
      type: "order_shipped",
      recipient: current.data.customer_email,
      payload: { order_id: id.data, order_number: current.data.order_number },
    });
  }
  revalidatePath("/admin/bestellingen"); revalidatePath(`/admin/bestellingen/${id.data}`);
  return Response.json({ ok: true });
}
