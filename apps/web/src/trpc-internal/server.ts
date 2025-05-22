import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { createCaller, createTRPCContext } from "@fulltemplate/api-internal";

import { env } from "~/env";

const createContext = cache(async () => {
  const oldHeads = await headers();
  const heads = new Headers(oldHeads);
  heads.set("x-trpc-source", "internal");
  heads.set("x-api-key", env.API_SECRET);

  return createTRPCContext({
    headers: heads,
  });
});

export const caller = createCaller(createContext);
