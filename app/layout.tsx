import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/cart-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Interieurkunst CB | Kunst van Carolien Ballast",
    template: "%s | Interieurkunst CB",
  },
  description:
    "Expressieve schilderijen, handgemaakte objecten en kunst in opdracht van Carolien Ballast, nabij Deventer.",
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Interieurkunst CB",
    title: "Interieurkunst CB | Kunst van Carolien Ballast",
    description: "Expressieve schilderijen, handgemaakte objecten en kunst in opdracht van Carolien Ballast.",
    images: [{ url: "/art/studio-hero.jpg", width: 1707, height: 1280, alt: "Werk van Carolien Ballast in een warm interieur" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interieurkunst CB | Kunst van Carolien Ballast",
    description: "Expressieve schilderijen, handgemaakte objecten en kunst in opdracht van Carolien Ballast.",
    images: ["/art/studio-hero.jpg"],
  },
};

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
