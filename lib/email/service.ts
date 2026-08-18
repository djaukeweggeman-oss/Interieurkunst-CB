import "server-only";
import type { Json } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export type EmailEventType =
  | "order_received"
  | "payment_confirmed"
  | "order_shipped"
  | "new_order_admin"
  | "new_contact_request"
  | "new_commission_request";

export type EmailEvent = {
  type: EmailEventType;
  recipient: string;
  payload: Json;
};

export interface EmailService {
  queue(event: EmailEvent): Promise<boolean>;
}

class SupabaseEmailQueue implements EmailService {
  async queue(event: EmailEvent) {
    const supabase = createAdminClient();
    if (!supabase) return false;
    const { error } = await supabase.from("email_events").insert({
      event_type: event.type,
      recipient: event.recipient,
      payload: event.payload,
      status: process.env.RESEND_API_KEY ? "pending" : "disabled",
    });
    if (error) {
      console.error("[email] E-mailgebeurtenis kon niet worden opgeslagen.");
      return false;
    }
    return true;
  }
}

export const emailService: EmailService = new SupabaseEmailQueue();
