import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "../trpc";

export const authConnectionRouter = {
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const connections = await ctx.db.connection.findMany({
      where: {
        status: {
          notIn: ["stopped", "error", "interrupted"],
        },
        apiKey: {
          userId: userId,
        },
      },
      select: {
        id: true,
        status: true,
        address: true,
        externalPort: true,
        internalPort: true,
        lastSeenAt: true,
        createdAt: true,
      },
      take: 500,
    });

    return connections;
  }),
  stopConnection: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const connection = await ctx.db.connection.findFirst({
        where: {
          id: input.id,
        },
      });

      if (!connection) {
        return {
          success: false,
          msg: "connection not found.",
        };
      }

      await ctx.db.connection.update({
        where: {
          id: connection.id,
        },
        data: {
          status: "stopped",
        },
      });
      return {
        success: true,
        msg: "Api key deleted successfully!",
      };
    }),
} satisfies TRPCRouterRecord;
