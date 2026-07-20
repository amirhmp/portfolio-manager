import { DEFAULT_DISPLAY_SCALE } from "@/constants";

export function parseTheme(raw: string | undefined): "light" | "dark" {
  return raw === "light" ? "light" : "dark";
}

export function parseDisplayScale(raw: string | undefined): number {
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_DISPLAY_SCALE;
}

/**
 * Compact suffix shown next to a scaled number so it's clear the value
 * isn't the raw one -- e.g. "50 M" instead of an unlabeled "50" that could
 * be mistaken for the actual amount. Recognized round factors get a
 * conventional letter; anything else (the user can pick *any* factor, per
 * the feature's whole point) falls back to a generic "÷N".
 */
export function getScaleSuffix(scale: number): string {
  if (scale === 1) return "";
  if (scale === 1_000) return "K";
  if (scale === 1_000_000) return "M";
  if (scale === 1_000_000_000) return "B";
  return `÷${scale.toLocaleString("en-US")}`;
}
