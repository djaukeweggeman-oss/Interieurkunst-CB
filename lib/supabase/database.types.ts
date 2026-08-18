/*
 * Generated-shape Supabase types for the versioned schema in supabase/migrations.
 * Regenerate after applying migrations with:
 * supabase gen types typescript --project-id <project-ref> > lib/supabase/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductRow = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price_cents: number | null;
  vat_percentage: number | null;
  width_cm: number | null;
  height_cm: number | null;
  depth_cm: number | null;
  weight_grams: number | null;
  dimensions: string | null;
  material: string | null;
  technique: string | null;
  year_created: number | null;
  status: "draft" | "available" | "reserved" | "sold" | "archived";
  is_featured: boolean;
  is_portfolio_item: boolean;
  can_be_shipped: boolean;
  can_be_picked_up: boolean;
  delivery_in_consultation: boolean;
  shipping_cost_cents: number | null;
  stock_quantity: number;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductImageRow = {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  full_name: string;
  role: "admin" | "editor";
  created_at: string;
  updated_at: string;
};

export type OrderRow = {
  id: string;
  public_token: string;
  order_number: string;
  status: "pending" | "awaiting_payment" | "paid" | "processing" | "shipped" | "completed" | "cancelled" | "refunded";
  payment_status: "open" | "pending" | "paid" | "failed" | "expired" | "cancelled" | "refunded";
  mollie_payment_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  billing_address: Json | null;
  shipping_address: Json | null;
  delivery_method: "pickup" | "shipping" | "consultation";
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  customer_note: string | null;
  reservation_expires_at: string | null;
  paid_at: string | null;
  processed_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  quantity: number;
  unit_price_cents: number;
  vat_percentage: number;
  vat_amount_cents: number;
  total_cents: number;
  created_at: string;
};

export type ReservationRow = {
  id: string;
  product_id: string;
  order_id: string;
  status: "active" | "converted" | "expired" | "released";
  expires_at: string;
  created_at: string;
  released_at: string | null;
  converted_at: string | null;
};

export type CommissionRequestRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  commission_type: string;
  preferred_size: string | null;
  preferred_style: string | null;
  preferred_colours: string | null;
  desired_date: string | null;
  message: string;
  reference_image_path: string | null;
  status: "new" | "contacted" | "in_discussion" | "accepted" | "declined" | "completed";
  admin_notes: string | null;
  submission_hash: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactRequestRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "closed";
  admin_notes: string | null;
  submission_hash: string | null;
  created_at: string;
  updated_at: string;
};

export type SiteSettingRow = {
  key: string;
  value: Json;
  is_public: boolean;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      categories: Table<CategoryRow, {
        id?: string; name: string; slug: string; description?: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string;
      }>;
      products: Table<ProductRow, {
        id?: string; category_id: string; name: string; slug: string; short_description?: string; description?: string;
        price_cents?: number | null; vat_percentage?: number | null; width_cm?: number | null; height_cm?: number | null;
        depth_cm?: number | null; weight_grams?: number | null; dimensions?: string | null; material?: string | null;
        technique?: string | null; year_created?: number | null; status?: ProductRow["status"]; is_featured?: boolean;
        is_portfolio_item?: boolean; can_be_shipped?: boolean; can_be_picked_up?: boolean; delivery_in_consultation?: boolean;
        shipping_cost_cents?: number | null; stock_quantity?: number; published_at?: string | null; archived_at?: string | null;
        created_at?: string; updated_at?: string;
      }>;
      product_images: Table<ProductImageRow, {
        id?: string; product_id: string; storage_path: string; alt_text?: string; sort_order?: number; is_primary?: boolean;
        width?: number | null; height?: number | null; created_at?: string;
      }>;
      profiles: Table<ProfileRow, {
        id: string; full_name?: string; role: ProfileRow["role"]; created_at?: string; updated_at?: string;
      }>;
      orders: Table<OrderRow>;
      order_items: Table<OrderItemRow>;
      reservations: Table<ReservationRow>;
      commission_requests: Table<CommissionRequestRow, {
        id?: string; name: string; email: string; phone?: string | null; commission_type: string;
        preferred_size?: string | null; preferred_style?: string | null; preferred_colours?: string | null;
        desired_date?: string | null; message: string; reference_image_path?: string | null;
        status?: CommissionRequestRow["status"]; admin_notes?: string | null; submission_hash?: string | null;
        created_at?: string; updated_at?: string;
      }>;
      contact_requests: Table<ContactRequestRow, {
        id?: string; name: string; email: string; phone?: string | null; subject: string; message: string;
        status?: ContactRequestRow["status"]; admin_notes?: string | null; submission_hash?: string | null;
        created_at?: string; updated_at?: string;
      }>;
      site_settings: Table<SiteSettingRow>;
      request_rate_limits: Table<{
        scope: string; key_hash: string; window_started_at: string; hit_count: number; updated_at: string;
      }>;
      payment_events: Table<{
        id: string; order_id: string; mollie_payment_id: string; payment_status: string; event_key: string; processed_at: string;
      }>;
      email_events: Table<{
        id: string; event_type: string; recipient: string; payload: Json; status: string; provider_message_id: string | null;
        last_error: string | null; created_at: string; sent_at: string | null;
      }>;
      admin_users: Table<{ user_id: string; created_at: string }>;
    };
    Views: Record<string, never>;
    Functions: {
      check_rate_limit: {
        Args: { p_scope: string; p_key_hash: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      release_expired_reservations: { Args: Record<PropertyKey, never>; Returns: number };
      release_order_reservation: { Args: { p_order_id: string }; Returns: undefined };
      process_mollie_payment: {
        Args: { p_order_id: string; p_payment_id: string; p_status: string };
        Returns: boolean;
      };
      reserve_products_for_checkout: {
        Args: { p_product_ids: string[]; p_customer: Json; p_delivery_method: string };
        Returns: {
          order_id: string; public_token: string; subtotal_cents: number; shipping_cents: number;
          total_cents: number; order_number: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
