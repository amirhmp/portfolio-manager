import * as React from "react";
import { normalizePrice } from "@/lib/utils";

export interface PriceLabelProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The raw numeric price to display. null/undefined render as the placeholder. */
  value: number | null | undefined;
  /** Max decimal places to display. Defaults to 2. */
  maxFractions?: number;
  /** Text shown when value is null/undefined (or otherwise invalid). Defaults to "". */
  placeholder?: string;
}

/**
 * Read-only price display: a <span> that renders `value` through
 * normalizePrice (comma thousands separators, no trailing ".00" for
 * whole numbers). A null/undefined/invalid value falls back to
 * `placeholder` instead of throwing.
 */
export const PriceLabel = React.forwardRef<HTMLSpanElement, PriceLabelProps>(
  ({ value, maxFractions, placeholder = "", ...props }, ref) => {
    let text = placeholder;

    if (value !== null && value !== undefined) {
      try {
        text = normalizePrice(value, maxFractions);
      } catch {
        text = placeholder;
      }
    }

    return (
      <span ref={ref} {...props}>
        {text}
      </span>
    );
  }
);

PriceLabel.displayName = "PriceLabel";