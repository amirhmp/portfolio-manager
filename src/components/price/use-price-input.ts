import * as React from "react";
import { normalizePrice } from "@/lib/utils";

export interface UsePriceInputOptions {
  value?: number | null;
  defaultValue?: number | null;
  maxFractions?: number;
  onChange?: (value: number | null, event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Strips a raw keystroke stream down to something parseable while the
 * user is actively typing: digits only, a single optional leading minus,
 * and at most one decimal point with no more than `maxFractions` digits
 * after it. Deliberately never adds thousands separators — that only
 * happens once the field is blurred (see usePriceInput below).
 */
function sanitizeRawInput(input: string, maxFractions: number): string {
  const isNegative = input.trim().startsWith("-");
  const cleaned = input.replace(/[^\d.]/g, "");

  const [firstPart, ...rest] = cleaned.split(".");
  let result = firstPart ?? "";
  if (rest.length > 0) {
    result += "." + rest.join("");
  }

  if (maxFractions === 0) {
    result = result.split(".")[0] ?? "";
  } else if (result.includes(".")) {
    const [intPart, fracPart] = result.split(".");
    result = `${intPart}.${fracPart.slice(0, maxFractions)}`;
  }

  return isNegative ? `-${result}` : result;
}

function rawToNumber(raw: string): number | null {
  if (raw === "" || raw === "-" || raw === ".") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * normalizePrice throws on invalid/non-finite input. Since value/defaultValue
 * are allowed to be null | undefined (and, from an external caller, anything
 * else invalid), guard the call so a bad value renders as empty rather than
 * crashing the component.
 */
function safeFormat(value: number | null | undefined, maxFractions: number): string {
  if (value === null || value === undefined) return "";
  try {
    return normalizePrice(value, maxFractions);
  } catch {
    return "";
  }
}

/**
 * Shared controlled/uncontrolled price-input logic.
 *
 * - While focused: shows the raw value being typed, with NO comma
 *   formatting, so the cursor never jumps around mid-edit.
 * - While blurred: shows the value formatted through normalizePrice,
 *   commas and all.
 */
export function usePriceInput({ value, defaultValue, maxFractions = 2, onChange }: UsePriceInputOptions) {
  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = React.useState<number | null>(defaultValue ?? null);
  const [isFocused, setIsFocused] = React.useState(false);
  const [rawText, setRawText] = React.useState<string>("");

  const numericValue = isControlled ? value ?? null : internalValue;

  // Formatted (with commas) when blurred; raw keystrokes (no commas) when focused.
  // null/undefined/invalid all resolve to "" so the native placeholder shows.
  const displayValue = isFocused ? rawText : safeFormat(numericValue, maxFractions);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = sanitizeRawInput(event.target.value, maxFractions);
      const nextValue = rawToNumber(sanitized);

      setRawText(sanitized);
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onChange?.(nextValue, event);
    },
    [isControlled, maxFractions, onChange]
  );

  const handleFocus = React.useCallback(() => {
    setIsFocused(true);
    // Drop into raw editing mode: unformatted, no commas.
    setRawText(numericValue === null || numericValue === 0 ? "" : String(numericValue));
  }, [numericValue]);

  const handleBlur = React.useCallback(() => {
    setIsFocused(false);
    // displayValue recalculates to the comma-formatted string automatically.
  }, []);

  return { displayValue, numericValue, handleChange, handleFocus, handleBlur };
}