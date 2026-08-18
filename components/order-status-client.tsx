"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";

export function OrderStatusClient({ paid, pending }: { paid: boolean; pending: boolean }) {
  const router = useRouter();
  const { clear } = useCart();
  useEffect(() => { if (paid) clear(); }, [clear, paid]);
  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(timer);
  }, [pending, router]);
  return null;
}
