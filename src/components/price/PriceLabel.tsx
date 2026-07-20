"use client";

import * as React from "react";
import { useSettings } from "@/components/settings-provider";
import { getScaleSuffix } from "@/lib/settings-cookies";
import { normalizePrice } from "@/lib/utils";

export interface PriceLabelProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The raw numeric price to display. null/undefined render as the placeholder. */
  value: number | null | undefined;
  /** Max decimal places to display. Defaults to 2. */
  maxFractions?: number;
  /** Text shown when value is null/undefined (or otherwise invalid). Defaults to "". */
  placeholder?: string;
  /**
   * Skip the app-wide Display Scale setting and show the exact value at
   * full precision, with no scale suffix -- use this for numbers that
   * must stay unambiguous regardless of the user's chosen scale (e.g. a
   * verification preview of an amount just typed in a different unit).
   */
  raw?: boolean;
}

/**
 * Read-only price display: a <span> that renders `value` (divided by the
 * user's Display Scale setting, unless `raw` is set) through
 * normalizePrice (comma thousands separators, no trailing ".00" for
 * whole numbers), followed by a small muted suffix indicating the scale
 * (e.g. "M" for millions) so a shortened number is never mistaken for the
 * real one. A null/undefined/invalid value falls back to `placeholder`
 * instead of throwing.
 */
export const PriceLabel = React.forwardRef<HTMLSpanElement, PriceLabelProps>(
  ({ value, maxFractions, placeholder = "", raw = false, ...props }, ref) => {
    const { displayScale } = useSettings();
    const scale = raw ? 1 : displayScale;

    let text = placeholder;

    if (value !== null && value !== undefined) {
      try {
        text = normalizePrice(value / scale, maxFractions);
      } catch {
        text = placeholder;
      }
    }

    const suffix = raw ? "" : getScaleSuffix(scale);

    return (
      <span ref={ref} {...props}>
        {text}
        {suffix && (
          <span className="ms-0.5 text-[0.7em] font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </span>
    );
  }
);

PriceLabel.displayName = "PriceLabel";
