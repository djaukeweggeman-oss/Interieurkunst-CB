export type MollieDatabaseStatus = "open" | "pending" | "paid" | "failed" | "expired" | "cancelled" | "refunded";

export function normalizeMollieStatus(status: string): MollieDatabaseStatus | null {
  if (status === "canceled") return "cancelled";
  if (status === "authorized") return "pending";
  if (["open", "pending", "paid", "failed", "expired", "cancelled", "refunded"].includes(status)) {
    return status as MollieDatabaseStatus;
  }
  return null;
}

export function calculateInclusiveVatAmount(totalCents: number, vatPercentage: 9 | 21) {
  return Math.round((totalCents * vatPercentage) / (100 + vatPercentage));
}

export const allowedOrderTransitions = {
  paid: ["processing"],
  processing: ["shipped"],
  shipped: ["completed"],
  awaiting_payment: ["cancelled"],
  pending: ["cancelled"],
  completed: [],
  cancelled: [],
  refunded: [],
} as const;

export function canTransitionOrder(current: string, next: string) {
  return (allowedOrderTransitions[current as keyof typeof allowedOrderTransitions] as readonly string[] | undefined)?.includes(next) ?? false;
}
