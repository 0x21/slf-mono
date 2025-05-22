"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

// import { env } from "~/env";

// if (
//   env.NEXT_PUBLIC_POSTHOG_KEY &&
//   env.NEXT_PUBLIC_APP_URL &&
//   process.env.NEXT_PUBLIC_POSTHOG_DISABLED !== "true" &&
//   typeof window !== "undefined"
// ) {
//   posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
//     api_host: `${env.NEXT_PUBLIC_APP_URL}/ingest`,
//     ui_host: env.NEXT_PUBLIC_POSTHOG_HOST,
//     capture_pageview: false,
//     capture_pageleave: true,
//   });
// }

export function PostHogPageview(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
