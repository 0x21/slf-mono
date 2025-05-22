import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { SessionProvider } from "next-auth/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import {
  // LocaleProvider,
  // PHProvider,
  // PostHogPageview,
  SocketProvider,
  ThemeProvider,
} from "~/lib/providers";

import "~/styles/globals.css";

// import { Suspense } from "react";

import { TRPCReactProvider } from "~/trpc/react";

// TODO move posthog components inside PHProvider

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* <LocaleProvider> */}
      {/* <PHProvider> */}
      <AppRouterCacheProvider options={{ enableCssLayer: true }}>
        <ThemeProvider>
          {/* <Suspense>
                  <PostHogPageview />
                </Suspense> */}
          <TRPCReactProvider>
            <SessionProvider>
              <SocketProvider>
                <NuqsAdapter>{children}</NuqsAdapter>
              </SocketProvider>
            </SessionProvider>
          </TRPCReactProvider>
        </ThemeProvider>
      </AppRouterCacheProvider>
      {/* </PHProvider> */}
      {/* </LocaleProvider> */}
    </>
  );
}
