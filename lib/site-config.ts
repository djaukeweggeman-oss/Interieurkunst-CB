export const siteConfig = {
  name: "Interieurkunst CB",
  artist: "Carolien Ballast",
  email: "caroliennm@hotmail.com",
  phone: "06-1369 2365",
  location: "Omgeving Deventer",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

