/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";

import { BRAND_TITLE } from "@fulltemplate/common";

export const metadata: Metadata = {
  title: `Not Found - ${BRAND_TITLE}`,
  description: `Not Found - ${BRAND_TITLE}`,
  robots: {
    index: false,
    googleBot: {
      index: false,
    },
  },
};

export default function NotFound() {
  return (
    <>
      {/* <Header /> */}
      <main className="grid min-h-screen place-items-center px-6 pt-16 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="flex flex-col items-center lg:flex-row lg:items-center lg:justify-between">
          <div className="text-center lg:max-w-md lg:text-left">
            <p className="text-base font-semibold text-green-500">404</p>
            <h1 className="text-primary mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              Oops! This page could not be found.
            </h1>
            <p className="text-muted-foreground mt-6 text-base leading-7">
              Sorry, we couldn&apos;t find the page you&apos;re looking for.
            </p>
            <div className="mt-8 flex justify-center gap-4 lg:justify-start">
              <Link
                href="/"
                className="rounded-md bg-green-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-2xs hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              >
                Go home
              </Link>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center lg:mt-0 lg:ml-8">
            <img
              src="/404.svg"
              alt="404 Illustration"
              className="mx-auto w-full max-w-sm lg:h-auto lg:max-w-lg"
            />
          </div>
        </div>
      </main>
      {/* <Footer /> */}
    </>
  );
}
