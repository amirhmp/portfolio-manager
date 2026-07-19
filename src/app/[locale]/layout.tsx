import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { hasLocale, type Locale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import {
  Fraunces,
  Geist,
  Geist_Mono,
  Markazi_Text,
  Vazirmatn,
} from "next/font/google";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const vazir = Vazirmatn({
  weight: ["200", "400", "500", "600", "800"],
  variable: "--font-vazir",
  subsets: ["arabic"],
  display: "swap",
});

const markaziText = Markazi_Text({
  weight: ["400", "500", "600", "700"],
  variable: "--font-markazi",
  subsets: ["arabic"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Sidebar" });
  return {
    title: t("brand"),
    description: "Gold and investment portfolio management",
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enable static rendering for this locale
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = locale === "fa" ? "rtl" : "ltr";
  const isRtl = dir === "rtl";

  // English: leave every font variable pointing at its own font (Geist /
  // Geist Mono / Fraunces) exactly as before.
  // Farsi: redirect --font-geist-sans and --font-geist-mono to Vazirmatn,
  // and --font-fraunces to Markazi Text (the closest available match to
  // Fraunces' warm, high-personality display feel), so every place in the
  // app that styles with font-sans/font-mono/font-serif renders correctly
  // in Farsi with no per-component changes needed.
  const fontOverrides: CSSProperties | undefined = isRtl
    ? ({
        "--font-geist-sans": "var(--font-vazir)",
        "--font-geist-mono": "var(--font-vazir)",
        "--font-fraunces": "var(--font-markazi)",
      } as CSSProperties)
    : undefined;

  return (
    <html
      lang={locale}
      dir={dir}
      className={cn(
        geistSans.variable,
        geistMono.variable,
        fraunces.variable,
        vazir.variable,
        markaziText.variable,
        "dark h-full antialiased",
      )}
      style={fontOverrides}
      suppressHydrationWarning
    >
      <body className="h-full flex overflow-hidden bg-background">
        <NextIntlClientProvider messages={messages}>
          <Sidebar />
          <main className="flex-1 h-full overflow-y-auto">
            <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
              {children}
            </div>
          </main>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}