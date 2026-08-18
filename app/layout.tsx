import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/cart-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicSiteSettings } from "@/lib/site-settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const title = typeof settings.seo.title === "string" ? settings.seo.title : "Interieurkunst CB | Kunst van Carolien Ballast";
  const description = typeof settings.seo.description === "string" ? settings.seo.description : "Expressieve schilderijen, handgemaakte objecten en kunst in opdracht van Carolien Ballast, nabij Deventer.";
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: title, template: "%s | Interieurkunst CB" },
    description,
    openGraph: { type: "website", locale: "nl_NL", siteName: settings.businessName, title, description, images: [{ url: "/art/studio-hero.jpg", width: 1707, height: 1280, alt: "Werk van Carolien Ballast in een warm interieur" }] },
    twitter: { card: "summary_large_image", title, description, images: ["/art/studio-hero.jpg"] },
  };
}

export const viewport: Viewport = {
  themeColor: "#f1ede5",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" data-scroll-behavior="smooth">
      <body>
        <CartProvider>
          <a className="skip-link" href="#main-content">Ga naar de inhoud</a>
          <SiteHeader />
          <div id="main-content">{children}</div>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
