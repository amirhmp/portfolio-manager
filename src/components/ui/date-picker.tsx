"use client";

import { DayPicker as FaDayPicker, faIR } from "@daypicker/persian";
import { DayPicker as EnDayPicker } from "@daypicker/react";
import { enUS } from "@daypicker/react/locale";
import "@daypicker/react/style.css";
import React, { useCallback, useId, useRef, useState } from "react";
import AnchoredPopover from "./anchored-popover";
import { Input } from "./input";

type Locale = "fa" | "en";

interface DatePickerProps {
  locale: Locale;
  name?: string;
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  formatDate?: (date: Date, locale: Locale) => string;
  className?: string;
  inputClassName?: string;
}

function defaultFormat(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function toISODateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function DatePicker({
  locale,
  name,
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled,
  required,
  formatDate = defaultFormat,
  className,
  inputClassName,
}: DatePickerProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<Date | undefined>(
    defaultValue,
  );
  const selected = isControlled ? value : internalValue;

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popupId = useId();

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (!isControlled) setInternalValue(date);
      onChange?.(date);
      setOpen(false);
    },
    [isControlled, onChange],
  );

  const displayValue = selected ? formatDate(selected, locale) : "";
  const isRTL = locale === "fa";

  return (
    <div
      ref={wrapperRef}
      className={`relative inline-block ${className ?? ""}`}
    >
      {name && (
        <input
          type="hidden"
          name={name}
          value={selected ? toISODateString(selected) : ""}
          required={required}
        />
      )}

      <Input
        type="text"
        readOnly
        disabled={disabled}
        value={displayValue}
        placeholder={placeholder ?? (isRTL ? "انتخاب تاریخ" : "Select date")}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popupId}
        dir={isRTL ? "rtl" : "ltr"}
        className={`border cursor-pointer ${inputClassName ?? ""}`}
      />

      <AnchoredPopover
        anchorRef={wrapperRef}
        open={open}
        onClose={() => setOpen(false)}
        id={popupId}
        dir={isRTL ? "rtl" : "ltr"}
        className="px-2.5 shadow-lg rounded-md border border-border bg-input"
      >
        {isRTL ? (
          <FaDayPicker
            animate
            mode="single"
            locale={faIR}
            selected={selected}
            onSelect={handleSelect}
          />
        ) : (
          <EnDayPicker
            animate
            mode="single"
            locale={enUS}
            selected={selected}
            onSelect={handleSelect}
          />
        )}
      </AnchoredPopover>
    </div>
  );
}

export default React.memo(DatePicker);
