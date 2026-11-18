import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getDatasetMeta } from "@/lib/data/queries";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Duke Hoops Intel", template: "%s · Duke Hoops Intel" },
  description: "Duke men's basketball players, seasons, statistics, and study tools — built on sourced data.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { meta, backend } = await getDatasetMeta();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-muted sm:px-6">
            <p>
              Unofficial fan/study project; not affiliated with Duke University. Stats via ESPN&apos;s public JSON endpoints
              {meta.generatedAt && <> · data refreshed {new Date(meta.generatedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</>}
              {" "}· backend: {backend}
            </p>
            <p>Missing values are shown as “—”, never as zero.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
