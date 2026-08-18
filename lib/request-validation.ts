import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().transform((value) => value || null);

export const contactRequestSchema = z.object({
  name: z.string().trim().min(2, "Vul je naam in.").max(100),
  email: z.email("Vul een geldig e-mailadres in.").max(254),
  phone: optionalText(30),
  subject: z.string().trim().min(2, "Kies een onderwerp.").max(150),
  message: z.string().trim().min(10, "Schrijf iets meer over je vraag.").max(5000),
  website: z.string().max(0).optional(),
  startedAt: z.coerce.number().positive(),
});

export const commissionRequestSchema = z.object({
  name: z.string().trim().min(2, "Vul je naam in.").max(100),
  email: z.email("Vul een geldig e-mailadres in.").max(254),
  phone: optionalText(30),
  commissionType: z.string().trim().min(2, "Kies een soort opdracht.").max(60),
  preferredSize: optionalText(80),
  preferredStyle: optionalText(1000),
  preferredColours: optionalText(500),
  desiredDate: z.string().trim().max(20).optional().transform((value) => value || null),
  message: z.string().trim().min(20, "Vertel iets meer over je wens.").max(5000),
  website: z.string().max(0).optional(),
  startedAt: z.coerce.number().positive(),
});

const addressSchema = z.object({
  addressLine: z.string().trim().min(3).max(200),
  postalCode: z.string().trim().min(4).max(20),
  city: z.string().trim().min(2).max(100),
  countryCode: z.literal("NL").default("NL"),
});

export const checkoutSchema = z.object({
  productIds: z.array(z.uuid()).min(1).max(10).refine((ids) => new Set(ids).size === ids.length, "Een uniek werk kan maar één keer worden besteld."),
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  phone: z.string().trim().min(6).max(30),
  delivery: z.enum(["pickup", "shipping", "consultation"]),
  address: z.string().trim().max(200).optional(),
  postalCode: z.string().trim().max(20).optional(),
  city: z.string().trim().max(100).optional(),
  note: z.string().trim().max(1000).optional(),
  terms: z.literal("on"),
}).superRefine((data, context) => {
  if (data.delivery !== "shipping") return;
  const parsedAddress = addressSchema.safeParse({
    addressLine: data.address,
    postalCode: data.postalCode,
    city: data.city,
    countryCode: "NL",
  });
  if (!parsedAddress.success) context.addIssue({ code: "custom", message: "Vul het afleveradres volledig in." });
});
