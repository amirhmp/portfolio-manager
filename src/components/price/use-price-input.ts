import { useSettings } from "@/components/settings-provider";
import { normalizePrice } from "@/lib/utils";
import * as React from "react";

export interface UsePriceInputOptions {
  value?: number | null;
  defaultValue?: number | null;
  maxFractions?: number;
  /**
   * When true, the user sees/types the value divided by the app-wide
   * Display Scale setting (e.g. "50" instead of "50,000,000"), but
   * `numericValue`/`onChange` still carry the real, unscaled number --
   * scaling is purely a presentation/entry-convenience layer. Leave this
   * off for anything that isn't a generic money amount (share counts,
   * percentages, the scale factor itself, or fields with their own
   * dedicated unit conversion like the gold form's mithqal pricing).
   */
  scaled?: boolean;
  onChange?: (
    value: number | null,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
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

/** Rounds to at most `fractions` decimal places, avoiding float noise from division. */
function roundToFractions(value: number, fractions: number): number {
  const factor = Math.pow(10, Math.max(0, fractions));
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * normalizePrice throws on invalid/non-finite input. Since value/defaultValue
 * are allowed to be null | undefined (and, from an external caller, anything
 * else invalid), guard the call so a bad value renders as empty rather than
 * crashing the component.
 */
function safeFormat(
  value: number | null | undefined,
  maxFractions: number,
): string {
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
 * - `numericValue` (and whatever's passed to `onChange`) is ALWAYS the
 *   real, unscaled number, regardless of the `scaled` option -- only the
 *   displayed/typed text is divided by the Display Scale factor.
 */
export function usePriceInput({
  value,
  defaultValue,
  maxFractions = 2,
  scaled = false,
  onChange,
}: UsePriceInputOptions) {
  const { displayScale } = useSettings();
  const scale = scaled ? displayScale : 1;

  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = React.useState<number | null>(
    defaultValue ?? null,
  );
  const [isFocused, setIsFocused] = React.useState(false);
  const [rawText, setRawText] = React.useState<string>("");

  // Always the real, unscaled value -- this is what callers/forms see.
  const numericValue = isControlled ? (value ?? null) : internalValue;

  // Formatted (with commas, and divided by scale) when blurred; raw
  // scaled keystrokes (no commas) when focused.
  const displayValue = isFocused
    ? rawText
    : safeFormat(
        numericValue === null ? null : numericValue / scale,
        maxFractions,
      );

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = sanitizeRawInput(event.target.value, maxFractions);
      const typedScaledValue = rawToNumber(sanitized);
      const nextRealValue =
        typedScaledValue === null ? null : typedScaledValue * scale;

      setRawText(sanitized);
      if (!isControlled) {
        setInternalValue(nextRealValue);
      }
      onChange?.(nextRealValue, event);
    },
    [isControlled, maxFractions, onChange, scale],
  );

  const handleFocus = React.useCallback(() => {
    setIsFocused(true);
    // Drop into raw editing mode: unformatted, no commas, scaled down so
    // what's shown matches what the user would have typed.
    if (numericValue === null || numericValue === 0) {
      setRawText("");
    } else {
      setRawText(String(roundToFractions(numericValue / scale, maxFractions)));
    }
  }, [numericValue, scale, maxFractions]);

  const handleBlur = React.useCallback(() => {
    setIsFocused(false);
    // displayValue recalculates to the comma-formatted string automatically.
  }, []);

  return {
    displayValue,
    numericValue,
    scale,
    handleChange,
    handleFocus,
    handleBlur,
  };
}
