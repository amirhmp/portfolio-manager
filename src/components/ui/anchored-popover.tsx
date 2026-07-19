/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const VIEWPORT_MARGIN = 8; // min gap kept between popup and viewport edge
const GAP = 4; // gap between anchor and popup

interface Position {
  top: number;
  left: number;
  width: number;
  ready: boolean; // false = not yet measured, keep invisible to avoid flash
}

interface AnchoredPopoverProps {
  /** Ref to the element the popover is anchored to (e.g. the input). */
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  id?: string;
  role?: string;
  dir?: "rtl" | "ltr";
  className?: string;
  /** Match popover min-width to the anchor's width. Default true. */
  matchAnchorWidth?: boolean;
}

/**
 * Renders `children` in a portal to document.body, positioned (fixed) relative
 * to `anchorRef`, with viewport collision handling (flips above/below, clamps
 * left/right) and outside-click / Escape to close. Reusable for any
 * anchor-triggered popup (date pickers, comboboxes, dropdown menus, etc.).
 */
export default function AnchoredPopover({
  anchorRef,
  open,
  onClose,
  children,
  id,
  role = "dialog",
  dir = "ltr",
  className,
  matchAnchorWidth = true,
}: AnchoredPopoverProps) {
  const [position, setPosition] = useState<Position | null>(null);
  const [mounted, setMounted] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const updatePosition = useCallback(() => {
    const anchorEl = anchorRef.current;
    if (!anchorEl) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const popupEl = popupRef.current;

    // First pass: popup not yet in DOM, so we don't know its size yet.
    // Render it invisibly below the anchor just to measure it next tick.
    if (!popupEl) {
      setPosition({
        top: anchorRect.bottom + GAP,
        left: anchorRect.left,
        width: anchorRect.width,
        ready: false,
      });
      return;
    }

    const popupRect = popupEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Vertical: prefer below; flip above if it doesn't fit but above does.
    const spaceBelow = vh - anchorRect.bottom;
    const spaceAbove = anchorRect.top;
    let top: number;
    if (popupRect.height + GAP <= spaceBelow) {
      top = anchorRect.bottom + GAP;
    } else if (popupRect.height + GAP <= spaceAbove) {
      top = anchorRect.top - popupRect.height - GAP;
    } else {
      top =
        spaceBelow >= spaceAbove
          ? anchorRect.bottom + GAP
          : anchorRect.top - popupRect.height - GAP;
      top = Math.min(
        Math.max(top, VIEWPORT_MARGIN),
        vh - popupRect.height - VIEWPORT_MARGIN,
      );
    }

    // Horizontal: align to anchor's left, clamped so it never overflows either edge.
    let left = anchorRect.left;
    const maxLeft = vw - popupRect.width - VIEWPORT_MARGIN;
    left = Math.min(
      Math.max(left, VIEWPORT_MARGIN),
      Math.max(maxLeft, VIEWPORT_MARGIN),
    );

    setPosition({ top, left, width: anchorRect.width, ready: true });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  useLayoutEffect(() => {
    if (!open || !position || position.ready) return;
    updatePosition();
  }, [open, position, updatePosition]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        anchorRef.current &&
        !anchorRef.current.contains(target) &&
        popupRef.current &&
        !popupRef.current.contains(target)
      ) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, anchorRef, onClose]);

  if (!open || !mounted || !position) return null;

  return createPortal(
    <div
      ref={popupRef}
      id={id}
      role={role}
      dir={dir}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        minWidth: matchAnchorWidth ? position.width : undefined,
        zIndex: 9999,
        visibility: position.ready ? "visible" : "hidden",
      }}
      className={className}
    >
      {children}
    </div>,
    document.body,
  );
}
