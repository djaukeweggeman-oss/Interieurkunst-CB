import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = { title: "Afrekenen", robots: { index: false, follow: false } };
export default function CheckoutPage() { return <main className="page-shell checkout-page"><header className="page-intro compact-intro"><p className="eyebrow">Veilig afrekenen</p><h1>Jouw unieke werk</h1><p>Een kunstwerk wordt tijdens het betaalproces tijdelijk gereserveerd.</p></header><CheckoutForm /></main>; }

