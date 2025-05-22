import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import superjson from "superjson";

import type { AppRouter } from "@fulltemplate/api-internal";

import { env } from "~/env";

export const apiInternal = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    httpBatchLink({
      transformer: superjson,
      url: env.AUTH_URL + "/api/trpc-internal",
      headers: {
        "x-api-key": env.API_SECRET,
      },
    }),
  ],
});
