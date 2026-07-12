import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses a price string into a number, stripping currency symbols,
 * thousands separators, and surrounding whitespace.
 */
export function parsePrice(price: string): number {
  const cleaned = price.trim().replace(/[^\d.\-]/g, "");
  const value = Number(cleaned);

  if (!Number.isFinite(value)) {
    throw new TypeError(
      `parsePrice: invalid price value: ${JSON.stringify(price)}`,
    );
  }

  return value;
}

/**
 * Normalizes a price value and returns it as a comma-separated string.
 * If the value has no fractional part it is returned without a decimal
 * point (12 -> "12", not "12.00").
 */
export function normalizePrice(
  price: number | string,
  maxFractions?: number,
): string {
  const value = typeof price === "number" ? price : parsePrice(price);

  if (!Number.isFinite(value)) {
    throw new TypeError(
      `normalizePrice: invalid price value: ${JSON.stringify(price)}`,
    );
  }

  const fractions = maxFractions ?? 2;

  if (!Number.isInteger(fractions) || fractions < 0) {
    throw new TypeError(
      `normalizePrice: maxFractions must be a non-negative integer, got: ${fractions}`,
    );
  }

  const factor = Math.pow(10, fractions);
  let rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  rounded = rounded === 0 ? 0 : rounded;

  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractions,
  });
}