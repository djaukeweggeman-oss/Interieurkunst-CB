export type ProductStatus = "draft" | "available" | "reserved" | "sold" | "archived";
export type ProductCategory = "painting" | "pot" | "object";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  status: ProductStatus;
  priceCents: number | null;
  vatRate: 9 | 21 | null;
  dimensions: string | null;
  material: string | null;
  technique: string | null;
  year: number | null;
  description: string;
  images: { src: string; alt: string; width: number; height: number }[];
  featured: boolean;
  isPortfolioItem?: boolean;
  canBeShipped?: boolean;
  canBePickedUp?: boolean;
  deliveryInConsultation?: boolean;
  shippingCostCents?: number | null;
  createdAt?: string;
  concept?: boolean;
  shipping: "pickup" | "shipping" | "consultation";
};

export const products: Product[] = [
  {
    id: "e92bbaff-4b77-476d-9708-788945000001",
    slug: "abstract-80x80",
    name: "Abstract 80 × 80",
    category: "painting",
    status: "available",
    priceCents: null,
    vatRate: null,
    dimensions: "80 × 80 cm",
    material: "Doek",
    technique: "Acryl",
    year: null,
    description:
      "Een gelaagd abstract werk waarin warme klei-, koraal- en nachttinten elkaar raken. Aanvullende productinformatie en prijs volgen na controle door Carolien.",
    images: [
      { src: "/art/abstract-80x80.jpg", alt: "Abstract schilderij van Carolien Ballast, 80 bij 80 centimeter", width: 1800, height: 1800 },
    ],
    featured: true,
    shipping: "consultation",
  },
  {
    id: "0a68a455-ff92-41b9-9708-788815000002",
    slug: "passion",
    name: "Passion",
    category: "painting",
    status: "available",
    priceCents: null,
    vatRate: null,
    dimensions: null,
    material: "Doek",
    technique: null,
    year: null,
    description:
      "Een krachtig portret met warme koper- en huidtinten tegen een diepe achtergrond. Afmetingen, techniek, jaar en prijs worden nog door Carolien aangevuld.",
    images: [{ src: "/art/passion.jpg", alt: "Het schilderij Passion van Carolien Ballast", width: 1600, height: 2400 }],
    featured: true,
    shipping: "consultation",
  },
  {
    id: "b5d39062-6f0f-4f5d-9708-788833000003",
    slug: "abstract-80x60",
    name: "Abstract 80 × 60",
    category: "painting",
    status: "available",
    priceCents: null,
    vatRate: null,
    dimensions: "80 × 60 cm",
    material: "Doek",
    technique: "Acryl",
    year: null,
    description:
      "Een tactiel abstract schilderij in mineraalblauw, groen en aarde. Prijs, jaar en leveringsdetails volgen na inhoudelijke controle.",
    images: [{ src: "/art/abstract-80x60.jpg", alt: "Abstract acrylschilderij van Carolien Ballast, 80 bij 60 centimeter", width: 929, height: 1085 }],
    featured: false,
    shipping: "consultation",
  },
  {
    id: "c973a82d-2507-4231-9708-788585000004",
    slug: "tijger",
    name: "Tijger",
    category: "painting",
    status: "available",
    priceCents: null,
    vatRate: null,
    dimensions: "100 × 100 cm",
    material: "Doek",
    technique: "Olieverf",
    year: null,
    description:
      "Een intens dierenportret in olieverf, frontaal geschilderd met een sterke blik. Prijs en jaar volgen na controle door Carolien.",
    images: [{ src: "/art/tijger.jpg", alt: "Olieverfschilderij van een tijger door Carolien Ballast", width: 1009, height: 1009 }],
    featured: true,
    shipping: "consultation",
  },
  {
    id: "00000000-0000-4000-8000-000000000101",
    slug: "handgemaakte-pot-concept",
    name: "Handgemaakte pot — concept",
    category: "pot",
    status: "draft",
    priceCents: null,
    vatRate: null,
    dimensions: null,
    material: null,
    technique: "Handgemaakt",
    year: null,
    description: "Tijdelijke productplek. Foto, afmetingen, materiaal, prijs en beschikbaarheid worden later toegevoegd.",
    images: [],
    featured: false,
    concept: true,
    shipping: "consultation",
  },
];

export const publicProducts = products.filter((product) => ["available", "reserved", "sold"].includes(product.status));

export function getProduct(slug: string) {
  return publicProducts.find((product) => product.slug === slug);
}

export const categoryLabels: Record<ProductCategory, string> = {
  painting: "Schilderijen",
  pot: "Potten",
  object: "Objecten",
};

export const statusLabels: Record<ProductStatus, string> = {
  draft: "Concept",
  available: "Beschikbaar",
  reserved: "Tijdelijk gereserveerd",
  sold: "Verkocht",
  archived: "Gearchiveerd",
};

export function formatPrice(priceCents: number | null) {
  if (priceCents === null) return "Prijs op aanvraag";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(priceCents / 100);
}

export type PortfolioItem = {
  id: string;
  category: "Portretten" | "Dieren" | "Abstract" | "Overig werk" | "Tekenen" | "Olieverf";
  src: string;
  alt: string;
  width: number;
  height: number;
};

export const portfolio: PortfolioItem[] = [
  { id: "portret-01", category: "Portretten", src: "/art/portfolio-portret-01.jpg", alt: "Portret uit het eerdere werk van Carolien Ballast", width: 872, height: 1279 },
  { id: "portret-02", category: "Portretten", src: "/art/portfolio-portret-02.jpg", alt: "Geschilderd portret uit Carolien Ballasts portfolio", width: 726, height: 960 },
  { id: "portret-03", category: "Portretten", src: "/art/portfolio-portret-03.jpg", alt: "Portretschilderij uit het eerdere werk van Carolien Ballast", width: 975, height: 1211 },
  { id: "dier-01", category: "Dieren", src: "/art/portfolio-dier-01.jpg", alt: "Dierenschilderij uit het eerdere werk van Carolien Ballast", width: 1045, height: 1051 },
  { id: "dier-02", category: "Dieren", src: "/art/portfolio-dier-02.jpg", alt: "Geschilderd dier uit Carolien Ballasts portfolio", width: 982, height: 982 },
  { id: "dier-03", category: "Dieren", src: "/art/portfolio-dier-03.jpg", alt: "Dierenportret door Carolien Ballast", width: 1080, height: 1479 },
  { id: "abstract-01", category: "Abstract", src: "/art/portfolio-abstract-01.jpg", alt: "Abstract schilderij uit het eerdere werk van Carolien Ballast", width: 2016, height: 1512 },
  { id: "abstract-02", category: "Abstract", src: "/art/portfolio-abstract-02.jpg", alt: "Abstract werk uit Carolien Ballasts portfolio", width: 1200, height: 1200 },
  { id: "abstract-03", category: "Abstract", src: "/art/portfolio-abstract-03.jpg", alt: "Gelaagd abstract schilderij van Carolien Ballast", width: 2048, height: 2048 },
  { id: "overig-01", category: "Overig werk", src: "/art/portfolio-overig-01.jpg", alt: "Werk uit het overige portfolio van Carolien Ballast", width: 948, height: 948 },
  { id: "tekenen-01", category: "Tekenen", src: "/art/portfolio-tekenen-01.jpg", alt: "Tekening uit het eerdere werk van Carolien Ballast", width: 1140, height: 1140 },
  { id: "olieverf-01", category: "Olieverf", src: "/art/portfolio-olieverf-01.jpg", alt: "Olieverfschilderij van Carolien Ballast", width: 2048, height: 2048 },
  { id: "olieverf-02", category: "Olieverf", src: "/art/portfolio-olieverf-02.jpg", alt: "Werk in olieverf uit Carolien Ballasts portfolio", width: 2048, height: 2048 },
  { id: "olieverf-03", category: "Olieverf", src: "/art/portfolio-olieverf-03.jpg", alt: "Eerder werk in olieverf van Carolien Ballast", width: 1080, height: 777 },
];
