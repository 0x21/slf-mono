import type { NextRequest } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@fulltemplate/api-internal";

export const runtime = "nodejs";

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc-internal",
    req: req,
    router: appRouter,
    createContext: () => {
      return createTRPCContext({
        headers: req.headers,
      });
    },
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
