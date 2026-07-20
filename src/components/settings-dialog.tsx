"use client";

import { PriceInput } from "@/components/price/PriceInput";
import { PriceLabel } from "@/components/price/PriceLabel";
import { useSettings } from "@/components/settings-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Switch from "@/components/ui/switch";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Languages, Moon, Settings as SettingsIcon, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState } from "react";

const LOCALES = ["en", "fa"] as const;
const SCALE_PRESETS = [1, 1_000, 1_000_000] as const;

export default function SettingsDialog({ collapsed }: { collapsed: boolean }) {
  const t = useTranslations("SettingsDialog");
  const tSidebar = useTranslations("Sidebar");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { theme, setTheme, displayScale, setDisplayScale } = useSettings();
  const [scaleInput, setScaleInput] = useState<number | null>(displayScale);

  function switchLocale(nextLocale: string) {
    router.replace(
      // @ts-expect-error -- pathname/params are dynamic across routes
      { pathname, params },
      { locale: nextLocale },
    );
  }

  function handleScaleChange(value: number | null) {
    setScaleInput(value);
    if (value != null && value > 0) {
      setDisplayScale(value);
    }
  }

  function presetLabel(preset: (typeof SCALE_PRESETS)[number]) {
    if (preset === 1) return t("presetNone");
    if (preset === 1_000) return t("presetThousands");
    return t("presetMillions");
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            title={tSidebar("settings")}
            className={cn(
              "cursor-pointer flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <SettingsIcon className="size-4 shrink-0" strokeWidth={1.75} />
            {!collapsed && tSidebar("settings")}
          </button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon
                  className="size-4 shrink-0 text-muted-foreground"
                  strokeWidth={1.75}
                />
              ) : (
                <Sun
                  className="size-4 shrink-0 text-muted-foreground"
                  strokeWidth={1.75}
                />
              )}
              <span className="text-sm font-medium">{tSidebar("theme")}</span>
            </span>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
              aria-label={tSidebar("theme")}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Languages
                className="size-4 shrink-0 text-muted-foreground"
                strokeWidth={1.75}
              />
              <span className="text-sm font-medium">
                {tSidebar("language")}
              </span>
            </span>
            <Select
              onValueChange={(value) => switchLocale(value!)}
              aria-label={tSidebar("language")}
              value={locale}
            >
              <SelectTrigger className="w-36">
                <SelectValue>
                  {(value) => (value === "en" ? "English" : "فارسی")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LOCALES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l === "en" ? "English" : "فارسی"}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-border pt-4">
            <Label htmlFor="display-scale" className="mb-1">
              {t("displayScaleTitle")}
            </Label>
            <p className="mb-2.5 text-xs text-muted-foreground">
              {t("displayScaleDescription")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <PriceInput
                id="display-scale"
                min={1}
                step="any"
                maxFractions={0}
                value={scaleInput}
                onChange={handleScaleChange}
                className="w-28 font-mono tabular-nums"
              />
              <div className="flex gap-1.5">
                {SCALE_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={displayScale === preset ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleScaleChange(preset)}
                  >
                    {presetLabel(preset)}
                  </Button>
                ))}
              </div>
            </div>
            <p className="mt-2.5 font-mono text-xs text-muted-foreground">
              {t("examplePreview")}: 1,234,567 → <PriceLabel value={1234567} />
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
