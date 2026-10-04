"use client";

import { getPortfolioChartPage } from "@/app/actions";
import { PORTFOLIO_CHART_PAGE_SIZE } from "@/constants";
import type { PortfolioChartPoint } from "@/lib/portfolio-valuation";
import { ChartLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import PortfolioTimelineChart from "./portfolio-timeline-chart";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; points: PortfolioChartPoint[]; hasMore: boolean };

/**
 * Mounted only while the dialog is open (Base UI unmounts the popup when
 * closed), so nothing is fetched or drawn until someone asks for the chart,
 * and every open starts from fresh data.
 */
function TimelineLoader({ userId }: { userId: number | null }) {
  const t = useTranslations("PortfolioTimelineDialog");
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const busy = useRef(false);

  // Newest page.
  useEffect(() => {
    let cancelled = false;
    getPortfolioChartPage(userId, null, PORTFOLIO_CHART_PAGE_SIZE)
      .then((result) => {
        if (cancelled) return;
        setState(
          result.success
            ? {
                status: "ready",
                points: result.data.points,
                hasMore: result.data.hasMore,
              }
            : { status: "error" },
        );
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  // Next-older page, prepended. The cursor is the oldest point we have.
  async function loadOlder() {
    if (state.status !== "ready" || !state.hasMore || busy.current) return;
    busy.current = true;
    setLoadingMore(true);
    try {
      const result = await getPortfolioChartPage(
        userId,
        state.points[0].id,
        PORTFOLIO_CHART_PAGE_SIZE,
      );
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setState((prev) =>
        prev.status === "ready"
          ? {
              status: "ready",
              points: [...result.data.points, ...prev.points],
              hasMore: result.data.hasMore,
            }
          : prev,
      );
    } catch {
      toast.error(t("loadFailed"));
    } finally {
      busy.current = false;
      setLoadingMore(false);
    }
  }

  if (state.status === "loading") {
    return <p className="py-16 text-center text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">{t("loadFailed")}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setState({ status: "loading" });
            setAttempt((n) => n + 1);
          }}
        >
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <PortfolioTimelineChart
      points={state.points}
      scope={userId == null ? "all" : "user"}
      hasMore={state.hasMore}
      loadingMore={loadingMore}
      onLoadMore={loadOlder}
    />
  );
}

/**
 * Button + dialog for the portfolio-over-time chart. `userId` omitted = the
 * pooled portfolio of all users (dashboard); set = that user's own portfolio
 * (user page). The chart itself is lazy: newest entries first, older ones
 * load as the user scrolls back (see `PortfolioTimelineChart`).
 */
export default function PortfolioTimelineDialog({ userId }: { userId?: number }) {
  const t = useTranslations("PortfolioTimelineDialog");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ChartLine data-icon="inline-start" />
        {t("button")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>
              {userId == null ? t("descriptionAll") : t("descriptionUser")}
            </DialogDescription>
          </DialogHeader>
          <TimelineLoader userId={userId ?? null} />
        </DialogContent>
      </Dialog>
    </>
  );
}
