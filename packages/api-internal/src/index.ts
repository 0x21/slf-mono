import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./root";
import { appRouter, createCaller } from "./root";
import { createTRPCContext } from "./trpc";

export type RouterInputs = inferRouterInputs<AppRouter>;

export type RouterOutputs = inferRouterOutputs<AppRouter>;

export { appRouter, createCaller, createTRPCContext };
export type { AppRouter };
