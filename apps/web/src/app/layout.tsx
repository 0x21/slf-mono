// sort-imports-ignore
// prettier-ignore
// import ReactScan from "~/components/utils/ReactScan";

import type { Metadata, Viewport } from "next";

import { Inter } from "next/font/google";

// import { getLocale } from "next-intl/server";

import {
  BRAND_DESCRIPTION,
  BRAND_HANDLE,
  BRAND_IMAGEURL,
  BRAND_NAME,
  BRAND_TITLE_LONG,
  BRAND_URL,
  cn,
} from "@fulltemplate/common";

import "~/styles/globals.css";

// import { Suspense } from "react";

import { Toaster } from "~/components/ui/sonner";
import ReactHotToast from "~/components/utils/ReactHotToast";
import DynamicScreenSizeIndicator from "~/components/utils/ScreenSizeIndicator";
import { env } from "~/env";
import CrispScript from "~/lib/scripts/crisp-script";
import PlausibleScript from "~/lib/scripts/plausible-script";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// TODO baseMetadata
export const metadata: Metadata = {
  title: BRAND_TITLE_LONG,
  description: BRAND_DESCRIPTION,
  icons: {
    icon: BRAND_IMAGEURL,
    shortcut: BRAND_IMAGEURL,
    apple: BRAND_IMAGEURL,
  },
  openGraph: {
    title: BRAND_TITLE_LONG,
    description: BRAND_DESCRIPTION,
    url: BRAND_URL,
    type: "website",
    images: BRAND_IMAGEURL,
    siteName: BRAND_TITLE_LONG,
    locale: "en-US",
  },
  twitter: {
    card: "summary_large_image",
    site: BRAND_URL,
    creator: BRAND_HANDLE,
    title: BRAND_TITLE_LONG,
    description: BRAND_DESCRIPTION,
    images: BRAND_IMAGEURL,
  },
  applicationName: BRAND_NAME,
  creator: BRAND_NAME,
  publisher: BRAND_URL,
  category: "technology",
  authors: [{ name: BRAND_NAME }],
  metadataBase: new URL(BRAND_URL),
  alternates: {
    canonical: BRAND_URL,
  },
  generator: "Next.js",
  keywords: [BRAND_NAME],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    google: "google",
    yandex: "yandex",
    yahoo: "yahoo",
  },
  appLinks: {
    web: {
      url: BRAND_URL,
      should_fallback: true,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  colorScheme: "light dark",
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const locale = await getLocale();
  const locale = "en";
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn("scroll-smooth font-sans antialiased", inter.variable)}
      >
        <Providers>{children}</Providers>
        {env.NODE_ENV !== "production" && <DynamicScreenSizeIndicator />}
        {/* {env.NODE_ENV !== "production" && <ReactScan />} */}
        {env.NODE_ENV !== "production" && env.NEXT_PUBLIC_CRISP_WEBSITE_ID && (
          <CrispScript />
        )}
        {env.NODE_ENV !== "production" && env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <PlausibleScript />
        )}
        <ReactHotToast />
        <Toaster closeButton richColors />
      </body>
    </html>
  );
}
