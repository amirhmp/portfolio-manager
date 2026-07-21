"use client";

import { Input as ShadcnInput } from "@/components/ui/input";
import { getScaleSuffix } from "@/lib/settings-cookies";
import { cn } from "@/lib/utils";
import * as React from "react";
import { usePriceInput } from "./use-price-input";

export interface PriceInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "type"
> {
  /** Controlled value. null/undefined render as empty (placeholder shows). */
  value?: number | null;
  /** Initial value when used uncontrolled. null/undefined start empty. */
  defaultValue?: number | null;
  /** Max decimal places to allow/display. Defaults to 2. */
  maxFractions?: number;
  /**
   * When true, the field shows/accepts the value divided by the app-wide
   * Display Scale setting (e.g. typing "50" when the scale is 1,000,000
   * produces a real value of 50,000,000), with a small suffix (M/K/etc.)
   * shown inside the field so it's clear it's scaled. The value returned
   * via `onChange` and submitted through the hidden `name` input is
   * always the real, unscaled number -- scaling only ever affects what's
   * shown/typed. Leave this off for anything that isn't a generic money
   * amount (share counts, percentages, the scale factor itself, or
   * fields with their own dedicated unit conversion).
   */
  scaled?: boolean;
  onChange?: (
    value: number | null,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
}

/**
 * Numeric-only price input.
 *
 * - Uncontrolled: <PriceInput defaultValue={9.99} onChange={...} />
 * - Controlled:   <PriceInput value={price} onChange={setPrice} />
 *
 * Shows the plain number (no commas) while the user is typing, and
 * reformats with commas via normalizePrice as soon as it loses focus.
 * A null/undefined (or otherwise invalid) value renders as an empty
 * string, so the native `placeholder` prop shows through as usual.
 *
 * Form integration: the visible text input never carries `name` — its
 * DOM value is a display string (e.g. "1,234.50") and would submit as
 * that string. Instead, if `name` is provided, a hidden <input> carries
 * the real parsed number and gets submitted as part of FormData/native
 * form submission. This is true even with `scaled` -- the hidden input
 * always carries the real, unscaled value.
 */
export const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  (
    {
      value,
      defaultValue,
      maxFractions,
      scaled,
      onChange,
      onFocus,
      onBlur,
      name,
      className,
      ...props
    },
    ref,
  ) => {
    const {
      displayValue,
      numericValue,
      scale,
      handleChange,
      handleFocus,
      handleBlur,
    } = usePriceInput({
      value,
      defaultValue,
      maxFractions,
      scaled,
      onChange,
    });

    const suffix = scaled ? getScaleSuffix(scale) : "";

    return (
      <>
        {name !== undefined && (
          <input type="hidden" name={name} value={numericValue ?? ""} />
        )}
        <div className="relative">
          <ShadcnInput
            {...props}
            ref={ref}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={(event) => {
              handleFocus();
              onFocus?.(event);
            }}
            onBlur={(event) => {
              handleBlur();
              onBlur?.(event);
            }}
            className={cn(suffix && "pe-9", className)}
          />
          {suffix && (
            <span className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
      </>
    );
  },
);
PriceInput.displayName = "PriceInput";
