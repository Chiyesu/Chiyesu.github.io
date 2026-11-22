import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { Cursor } from "@/components/layout/Cursor";
import { Footer } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";
import { Preloader } from "@/components/layout/Preloader";
import { SceneLayer } from "@/components/layout/SceneLayer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Splash } from "@/components/layout/Splash";
import { site } from "@/content/site";
import "./globals.css";

const sans = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin"] });
const serif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});
const mono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

const title = `${site.name} | ${site.role}`;

/**
 * Runs before first paint. The splash shows once per browser session on the home page.
 * The timer only acts if the app never starts, so a failed script can't leave a visitor on the splash.
 */
const BOOT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js');try{if(location.pathname==='/'&&!location.hash&&!sessionStorage.getItem('frontier-splash')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('splash-first','splash-hold');history.scrollRestoration='manual';setTimeout(function(){if(!d.dataset.splashLive)d.classList.remove('splash-first','splash-hold')},25000)}}catch(e){}})()`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s | ${site.name}` },
  description: site.description,
  authors: [{ name: site.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title,
    description: site.description,
    siteName: site.name,
    images: [{ url: "/images/og.jpg", width: 1200, height: 630, alt: "A metallic knot sculpture around a glass core" }],
  },
  twitter: { card: "summary_large_image", title, description: site.description, images: ["/images/og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#08090b" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${serif.variable} ${mono.variable} antialiased`}>
      <body className="min-h-svh">
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <a
          href="#main"
          className="fixed left-4 top-4 z-[100] -translate-y-24 bg-mist px-4 py-2 text-sm text-void focus:translate-y-0"
        >
          Skip to content
        </a>
        <Preloader />
        <Splash />
        <Navigation />
        <main id="main">{children}</main>
        <Footer />
        <SmoothScroll />
        <SceneLayer />
        <Cursor />
      </body>
    </html>
  );
}
