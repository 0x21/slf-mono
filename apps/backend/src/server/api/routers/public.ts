import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const publicRouter = createTRPCRouter({
  ping: publicProcedure.query(() => {
    return "pong";
  }),
});
