import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

/** Format a number as Indian Rupees, e.g. 1234567 -> "₹12,34,567". */
export function formatINR(amount: number | string | null | undefined): string {
  const n = Number(amount)
  return inrFormatter.format(Number.isFinite(n) ? n : 0)
}
