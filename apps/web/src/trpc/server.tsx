import "server-only";

import { cache } from "react";
// import type { TRPCQueryOptions } from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
// import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createHydrationHelpers } from "@trpc/react-query/rsc";

// import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import type { AppRouter } from "@fulltemplate/api";
import { createCaller, createTRPCContext } from "@fulltemplate/api";

import { createQueryClient } from "~/trpc/query-client";

const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

const getQueryClient = cache(createQueryClient);
export const caller = createCaller(createContext);

export const { trpc: api } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);

// export const trpc = createTRPCOptionsProxy<AppRouter>({
//   router: appRouter,
//   ctx: createContext,
//   queryClient: getQueryClient,
// });

// export function HydrateClient(props: { children: React.ReactNode }) {
//   const queryClient = getQueryClient();
//   return (
//     <HydrationBoundary state={dehydrate(queryClient)}>
//       {props.children}
//     </HydrationBoundary>
//   );
// }

// export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
//   queryOptions: T,
// ) {
//   const queryClient = getQueryClient();
//   if (queryOptions.queryKey[1]?.type === "infinite") {
//     void queryClient.prefetchInfiniteQuery(queryOptions as any);
//   } else {
//     void queryClient.prefetchQuery(queryOptions);
//   }
// }
