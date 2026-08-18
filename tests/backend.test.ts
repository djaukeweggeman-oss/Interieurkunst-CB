import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import sharp from "sharp";
import { processSafeImage } from "../lib/image-processing";
import { calculateInclusiveVatAmount, canTransitionOrder, normalizeMollieStatus } from "../lib/order-rules";
import { adminProductSchema } from "../lib/product-validation";
import { checkoutSchema, commissionRequestSchema, contactRequestSchema } from "../lib/request-validation";
import { createSubmissionHash, sanitizePlainText } from "../lib/security-core";

const checkout = {
  productIds: ["e92bbaff-4b77-476d-9708-788945000001"],
  name: "Test Bezoeker",
  email: "bezoeker@example.com",
  phone: "0612345678",
  delivery: "pickup",
  terms: "on",
};

test("checkout negeert een door de browser meegestuurde prijs", () => {
  const parsed = checkoutSchema.parse({ ...checkout, priceCents: 1, vatPercentage: 0, shippingCents: -1000 });
  assert.equal("priceCents" in parsed, false);
  assert.equal("vatPercentage" in parsed, false);
  assert.equal("shippingCents" in parsed, false);
});

test("hetzelfde unieke werk kan niet dubbel worden gereserveerd", () => {
  const productId = checkout.productIds[0];
  const parsed = checkoutSchema.safeParse({ ...checkout, productIds: [productId, productId] });
  assert.equal(parsed.success, false);
});

test("verzendadres is verplicht bij verzending", () => {
  assert.equal(checkoutSchema.safeParse({ ...checkout, delivery: "shipping" }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...checkout, delivery: "shipping", address: "Dorpsstraat 1", postalCode: "1234 AB", city: "Deventer" }).success, true);
});

test("Mollie-statussen worden beperkt en genormaliseerd", () => {
  assert.equal(normalizeMollieStatus("canceled"), "cancelled");
  assert.equal(normalizeMollieStatus("authorized"), "pending");
  assert.equal(normalizeMollieStatus("paid"), "paid");
  assert.equal(normalizeMollieStatus("unknown"), null);
});

test("btw uit een consumentenprijs wordt reproduceerbaar berekend", () => {
  assert.equal(calculateInclusiveVatAmount(10900, 9), 900);
  assert.equal(calculateInclusiveVatAmount(12100, 21), 2100);
});

test("orderstatussen volgen alleen toegestane overgangen", () => {
  assert.equal(canTransitionOrder("paid", "processing"), true);
  assert.equal(canTransitionOrder("paid", "shipped"), false);
  assert.equal(canTransitionOrder("awaiting_payment", "cancelled"), true);
  assert.equal(canTransitionOrder("completed", "processing"), false);
});

test("een beschikbaar product vereist prijs, btw en levering", () => {
  const base = {
    name: "Werk", slug: "werk", shortDescription: "", description: "", categoryId: "e92bbaff-4b77-476d-9708-788945000001",
    status: "available", price: "", vatPercentage: "", widthCm: "", heightCm: "", depthCm: "", weightGrams: "",
    material: "", technique: "", yearCreated: "", shippingPrice: "", canBeShipped: false, canBePickedUp: true,
    deliveryInConsultation: false, published: true, isFeatured: false, isPortfolioItem: false,
  };
  assert.equal(adminProductSchema.safeParse(base).success, false);
  assert.equal(adminProductSchema.safeParse({ ...base, price: "250", vatPercentage: "9" }).success, true);
});

test("contact- en opdrachtformulieren valideren honeypot en inhoud", () => {
  const common = { name: "Bezoeker", email: "test@example.com", phone: "", website: "", startedAt: Date.now() - 3000 };
  assert.equal(contactRequestSchema.safeParse({ ...common, subject: "Een kunstwerk", message: "Dit is een geldige contactvraag." }).success, true);
  assert.equal(commissionRequestSchema.safeParse({ ...common, commissionType: "Portret", preferredSize: "80 x 60", preferredStyle: "Warm", preferredColours: "Aarde", desiredDate: "", message: "Dit is een uitvoerige en geldige opdrachtomschrijving." }).success, true);
  assert.equal(contactRequestSchema.safeParse({ ...common, website: "spam.test", subject: "Vraag", message: "Dit is een geldige contactvraag." }).success, false);
});

test("platte tekst wordt begrensd en ontdaan van besturingscodes", () => {
  assert.equal(sanitizePlainText("  Hallo\u0000   wereld\r\n\r\n\r\nvolgende  ", 100), "Hallo wereld\n\nvolgende");
  assert.equal(createSubmissionHash("contact", ["A", "B"]), createSubmissionHash("contact", ["a", "b"]));
  assert.notEqual(createSubmissionHash("contact", ["a"]), createSubmissionHash("commission", ["a"]));
});

test("afbeeldingen worden echt gecontroleerd en zonder metadata opnieuw gecodeerd", async () => {
  const source = await sharp({ create: { width: 32, height: 24, channels: 3, background: "#a34f32" } }).jpeg().withExif({ IFD0: { Copyright: "privacy-test" } }).toBuffer();
  const file = new File([source], "referentie.jpg", { type: "image/jpeg" });
  const result = await processSafeImage(file, 1024 * 1024);
  const metadata = await sharp(result.buffer).metadata();
  assert.equal(result.width, 32);
  assert.equal(result.height, 24);
  assert.equal(metadata.exif, undefined);
  const fake = new File([Buffer.from("geen afbeelding")], "fake.jpg", { type: "image/jpeg" });
  await assert.rejects(() => processSafeImage(fake), /INVALID_IMAGE_SIGNATURE/);
});

test("migratie bevat RLS, privé-opslag en atomische reservering", () => {
  const sql = readFileSync("supabase/migrations/202608180002_complete_backend.sql", "utf8");
  for (const table of ["profiles", "request_rate_limits", "payment_events", "email_events"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /'commission-uploads', 'commission-uploads', false/i);
  assert.match(sql, /for update;/i);
  assert.match(sql, /one_active_reservation_per_product/i);
  assert.match(sql, /on conflict \(event_key\) do nothing/i);
  assert.match(sql, /grant execute on function public\.reserve_products_for_checkout[^;]+to service_role/i);
});

test("iedere beheer-API controleert server-side autorisatie", () => {
  const files = [
    "app/api/admin/products/route.ts",
    "app/api/admin/products/[id]/route.ts",
    "app/api/admin/uploads/route.ts",
    "app/api/admin/products/[id]/images/[imageId]/route.ts",
    "app/api/admin/orders/[id]/route.ts",
    "app/api/admin/orders/[id]/refund/route.ts",
    "app/api/admin/requests/[kind]/[id]/route.ts",
    "app/api/admin/settings/[key]/route.ts",
  ];
  for (const file of files) assert.match(readFileSync(file, "utf8"), /(getAdminUser|requireAdminRole)\(\)/, file);
});
