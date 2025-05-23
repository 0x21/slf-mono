import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "../trpc";

export const authApiRouter = {
  getApiKeys: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const apiKeys = await ctx.db.apiKey.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        expiresAt: true,
        token: true,
        createdAt: true,
      },
      take: 5,
    });

    return apiKeys;
  }),

  createApiKey: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const apiKeys = await ctx.db.apiKey.findMany({
      where: {
        userId,
      },
      select: {
        expiresAt: true,
        token: true,
        createdAt: true,
      },
    });

    if (apiKeys.length >= 5) {
      return {
        success: false,
        msg: "You can't create api keys more than 5",
      };
    }
    const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

    await ctx.db.apiKey.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        expiresAt: new Date(Date.now() + THIRTY_DAYS_IN_MS),
      },
    });

    return {
      success: true,
      msg: "Api key generated successfully!",
    };
  }),
  deleteApiKey: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = await ctx.db.apiKey.findFirst({
        where: {
          id: input.id,
        },
      });

      if (!apiKey) {
        return {
          success: false,
          msg: "Api key not found.",
        };
      }

      await ctx.db.apiKey.delete({
        where: {
          id: apiKey.id,
        },
      });
      return {
        success: true,
        msg: "Api key deleted successfully!",
      };
    }),
} satisfies TRPCRouterRecord;
