import type { TRPCRouterRecord } from "@trpc/server";

export const authRouter = {
  // getSession: publicProcedure.query(({ ctx }) => {
  //   return ctx.session
  //     ? {
  //         id: ctx.session.id,
  //       }
  //     : null;
  // }),
} satisfies TRPCRouterRecord;
