import { authRouter } from "~/server/api/routers/auth";
import { publicRouter } from "~/server/api/routers/public";
import { createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  public: publicRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
