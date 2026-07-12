import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizePrice } from "@/lib/utils";

/**
 * Cleans up a raw keystroke stream while the user is actively typing:
 * digits only, a single optional leading minus, and at most one decimal
 * point with no more than `maxFractions` digits after it.
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

function rawToNumber(raw: string): number {
  if (raw === "" || raw === "-" || raw === ".") return 0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

/* ------------------------------------------------------------------ */
/*  2. Shared controlled/uncontrolled input logic                      */
/* ------------------------------------------------------------------ */

export interface UsePriceInputOptions {
  value?: number;
  defaultValue?: number;
  maxFractions?: number;
  onChange?: (
    value: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
}

/**
 * Encapsulates all the "is this controlled or uncontrolled, what do we
 * show while focused vs blurred" logic so both <PriceInput> and
 * <PriceInputWithLabel> can share a single source of truth.
 */
function usePriceInput({
  value,
  defaultValue,
  maxFractions = 2,
  onChange,
}: UsePriceInputOptions) {
  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = React.useState<number>(
    defaultValue ?? 0,
  );
  const [isFocused, setIsFocused] = React.useState(false);
  const [rawText, setRawText] = React.useState<string>("");

  const numericValue = isControlled ? (value as number) : internalValue;

  const displayValue = isFocused
    ? rawText
    : normalizePrice(numericValue, maxFractions);

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
    [isControlled, maxFractions, onChange],
  );

  const handleFocus = React.useCallback(() => {
    setIsFocused(true);
    setRawText(numericValue === 0 ? "" : String(numericValue));
  }, [numericValue]);

  const handleBlur = React.useCallback(() => {
    setIsFocused(false);
  }, []);

  return { displayValue, handleChange, handleFocus, handleBlur };
}

/* ------------------------------------------------------------------ */
/*  3. Base component — shared UI, reused by both exported components  */
/* ------------------------------------------------------------------ */

export interface PriceInputBaseProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "type"
> {
  value?: number;
  defaultValue?: number;
  maxFractions?: number;
  onChange?: (
    value: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
}

const PriceInputBase = React.forwardRef<HTMLInputElement, PriceInputBaseProps>(
  (
    { value, defaultValue, maxFractions, onChange, onFocus, onBlur, ...props },
    ref,
  ) => {
    const { displayValue, handleChange, handleFocus, handleBlur } =
      usePriceInput({
        value,
        defaultValue,
        maxFractions,
        onChange,
      });

    return (
      <Input
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
    );
  },
);
PriceInputBase.displayName = "PriceInputBase";

/* ------------------------------------------------------------------ */
/*  4. Public components                                               */
/* ------------------------------------------------------------------ */

export type PriceInputProps = PriceInputBaseProps;

/** A numeric-only input that displays its value using normalizePrice. */
export const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  (props, ref) => {
    return <PriceInputBase ref={ref} {...props} />;
  },
);
PriceInput.displayName = "PriceInput";

export interface PriceInputWithLabelProps extends PriceInputBaseProps {
  label: string;
  id?: string;
}

/** Same as <PriceInput>, plus a connected shadcn <Label>. */
export const PriceInputWithLabel = React.forwardRef<
  HTMLInputElement,
  PriceInputWithLabelProps
>(({ label, id, className, ...props }, ref) => {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={inputId}>{label}</Label>
      <PriceInputBase id={inputId} ref={ref} {...props} />
    </div>
  );
});
PriceInputWithLabel.displayName = "PriceInputWithLabel";

/* ------------------------------------------------------------------ */
/*  5. Demo — controlled + uncontrolled usage                          */
/* ------------------------------------------------------------------ */

export default function PriceInputDemo() {
  // Controlled usage: parent owns the number.
  const [controlledPrice, setControlledPrice] = React.useState(1234.5);

  // Uncontrolled usage: component owns its own state internally,
  // we just listen via onChange.
  const [lastUncontrolledValue, setLastUncontrolledValue] = React.useState<
    number | null
  >(null);

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-8 p-8">
      <div>
        <h2 className="mb-1 text-sm font-medium text-neutral-500">
          Controlled
        </h2>
        <PriceInputWithLabel
          label="Sale price"
          value={controlledPrice}
          onChange={(value) => setControlledPrice(value)}
          maxFractions={2}
        />
        <p className="mt-2 text-xs text-neutral-400">
          Parent state: <span className="font-mono">{controlledPrice}</span>
        </p>
      </div>

      <div>
        <h2 className="mb-1 text-sm font-medium text-neutral-500">
          Uncontrolled
        </h2>
        <PriceInputWithLabel
          label="List price"
          defaultValue={99.99}
          onChange={(value) => setLastUncontrolledValue(value)}
          maxFractions={2}
        />
        <p className="mt-2 text-xs text-neutral-400">
          Last onChange value:{" "}
          <span className="font-mono">{lastUncontrolledValue ?? "—"}</span>
        </p>
      </div>

      <div>
        <h2 className="mb-1 text-sm font-medium text-neutral-500">
          Label-less, whole numbers only
        </h2>
        <PriceInput defaultValue={5} maxFractions={0} placeholder="0" />
      </div>
    </div>
  );
}
