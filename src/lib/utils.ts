import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses a price string into a number, stripping currency symbols,
 * thousands separators, and surrounding whitespace.
 *
 * @param price - A price string like "$1,234.56" or " 19.99 ".
 * @returns The parsed numeric value.
 * @throws {TypeError} If the string cannot be parsed into a valid, finite number.
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
 * Normalizes a price value and returns it as a comma-separated string,
 * rounded to a fixed number of decimal places.
 *
 * If the value has no fractional part (or trailing zero fractions), it is
 * returned without a decimal point, e.g. 12 -> "12", not "12.00".
 *
 * @param price - The price to normalize. Can be a number or a string like "$1,234.5".
 * @param maxFractions - Maximum number of decimal places to keep (default: 2).
 * @returns The normalized price as a string with comma thousands separators, e.g. "1,234.57".
 * @throws {TypeError} If the input cannot be parsed into a valid, finite number.
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

  // Round to `fractions` decimals while avoiding common floating-point errors,
  // e.g. (1.005).toFixed(2) === "1.00" due to binary float representation.
  const factor = Math.pow(10, fractions);
  let rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  rounded = rounded === 0 ? 0 : rounded; // normalize -0 to 0

  // Format with comma thousands separators, letting toLocaleString trim
  // trailing zero fractions (e.g. 12 -> "12", 12.5 -> "12.5", not "12.00").
  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractions,
  });
}