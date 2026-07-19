import "./globals.css";

// Minimal root layout required by Next.js App Router.
// Actual locale-specific layout is in /app/[locale]/layout.tsx.
// The middleware (middleware.ts) automatically redirects / to /en or /ar.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
