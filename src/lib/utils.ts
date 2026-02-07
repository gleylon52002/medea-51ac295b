import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string | null | undefined): string {
  const numericPrice = typeof price === 'number' ? price : parseFloat(String(price || 0));
  const safePrice = isNaN(numericPrice) ? 0 : numericPrice;

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(safePrice);
}

export function safeJsonParse<T>(json: any, fallback: T): T {
  if (!json) return fallback;
  if (typeof json !== 'string') return json as T;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error("JSON parsing error:", error, "Input:", json);
    return fallback;
  }
}
