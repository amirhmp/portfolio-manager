"use client";

import * as React from "react";
import { Input as ShadcnInput } from "@/components/ui/input";
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
 * form submission.
 */
export const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  (
    {
      value,
      defaultValue,
      maxFractions,
      onChange,
      onFocus,
      onBlur,
      name,
      ...props
    },
    ref,
  ) => {
    const {
      displayValue,
      numericValue,
      handleChange,
      handleFocus,
      handleBlur,
    } = usePriceInput({
      value,
      defaultValue,
      maxFractions,
      onChange,
    });

    return (
      <>
        {name !== undefined && (
          <input type="hidden" name={name} value={numericValue ?? ""} />
        )}
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
        />
      </>
    );
  },
);
PriceInput.displayName = "PriceInput";
