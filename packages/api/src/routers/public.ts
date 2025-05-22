/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { TRPCRouterRecord } from "@trpc/server";
import moment from "moment";
import { v4 } from "uuid";
import { z } from "zod";

import { auth, invalidateSessionToken } from "@fulltemplate/auth";
import { createEvent } from "@fulltemplate/event";
import { getAppConfig } from "@fulltemplate/helpers/src/config";
import { getRequestDetails } from "@fulltemplate/helpers/src/request-details";

import { caller } from "../server";
import { publicProcedure } from "../trpc";

export const publicRouter = {
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session
      ? {
          id: ctx.session.id,
        }
      : null;
  }),
  signOut: publicProcedure.mutation(async ({ ctx }) => {
    const session = await auth();
    if (!session) {
      return { success: true };
    }

    if (!ctx.token) {
      return { success: true };
    }
    await invalidateSessionToken(ctx.token);
    return { success: true };
  }),
  forgotPassword: publicProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findFirst({
        where: {
          email: input.email,
        },
      });
      if (!user) {
        return { success: true };
      }

      const account = await ctx.db.account.findFirst({
        where: {
          userId: user.id,
          OR: [
            {
              type: "credentials",
            },
            {
              type: "email",
            },
          ],
        },
      });

      if (!account) {
        return { success: true };
      }

      const otp = v4();
      await ctx.db.passwordResetToken.deleteMany({
        where: {
          email: input.email,
        },
      });

      await ctx.db.passwordResetToken.create({
        data: {
          email: input.email,
          token: otp,
          expiresAt: moment(new Date()).add(1, "day").toDate(),
        },
      });

      const appConfig = await getAppConfig();
      if (appConfig.isEmailEnabled) {
        await caller.authMail.sendResetPassword({
          email: user.email ?? "",
          firstName: user.firstName,
          otp: otp,
        });
      }

      await createEvent({
        userId: user.id,
        category: "email",
        type: "forgot-password",
        action: "created",
        status: "success",
      });

      return { success: true };
    }),
  resetPassword: publicProcedure
    .input(
      z.object({
        password: z.string(),
        otp: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const reqDetails = await getRequestDetails();
      const token = await ctx.db.passwordResetToken.findFirst({
        where: {
          token: input.otp,
        },
      });
      if (!token) {
        return { success: true };
      }

      const user = await ctx.db.user.findFirst({
        where: {
          email: token.email,
        },
        select: {
          id: true,
          accounts: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
        };
      }

      const result = await caller.auth.hashPassword({
        password: input.password,
      });
      if (!result.success) {
        await createEvent({
          userId: user.id,
          category: "auth",
          type: "reset-password",
          action: "created",
          status: "failed",
          error: "invalid-credentials",
          reqDetails: reqDetails,
        });
        return {
          success: false,
        };
      }

      await ctx.db.account.update({
        where: {
          id: user.accounts[0]!.id,
        },
        data: {
          password: result.data,
        },
      });

      await ctx.db.userConfig.upsert({
        where: {
          userId: user.id,
        },
        update: {
          requiresPasswordChange: false,
        },
        create: {
          userId: user.id,
          requiresPasswordChange: false,
        },
      });

      await ctx.db.session.deleteMany({
        where: {
          userId: user.id,
        },
      });

      await ctx.db.passwordResetToken.delete({
        where: {
          token: input.otp,
        },
      });

      await createEvent({
        userId: user.id,
        category: "auth",
        type: "reset-password",
        action: "created",
        status: "success",
        reqDetails: reqDetails,
      });
      return {
        success: true,
      };
    }),
  verifyAccount: publicProcedure
    .input(
      z.object({
        otp: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const reqDetails = await getRequestDetails();
      const token = await ctx.db.verificationToken.findFirst({
        where: {
          token: input.otp,
        },
      });
      if (!token) {
        return { success: false };
      }

      const user = await ctx.db.user.findFirst({
        where: {
          // email: token.email,
        },
        select: {
          id: true,
          accounts: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
        };
      }

      await ctx.db.user.update({
        where: {
          id: user.id,
        },
        data: {
          emailVerified: new Date(),
        },
      });

      await ctx.db.verificationToken.delete({
        where: {
          token: input.otp,
        },
      });

      await createEvent({
        userId: user.id,
        category: "auth",
        type: "verify",
        action: "created",
        status: "success",
        reqDetails: reqDetails,
      });
      return {
        success: true,
      };
    }),
  getOrganizationByInviteToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const invite = await ctx.db.organizationInvite.findFirst({
        where: {
          id: input.token,
        },
        select: {
          status: true,
          organization: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      });
      if (!invite) {
        return null;
      }
      if (invite.status !== "waiting") {
        return null;
      }
      return {
        id: invite.organization.id,
        name: invite.organization.name,
        slug: invite.organization.slug,
      };
    }),
  // verifyCaptcha: publicProcedure
  //   .input(
  //     z.object({
  //       token: z.string(),
  //     }),
  //   )
  //   .mutation(async ({ input }) => {
  //     if (env.RECAPTCHA_SECRET_KEY === undefined) {
  //       return {
  //         success: true,
  //       };
  //     }
  //     try {
  //       const response = await fetch(
  //         `https://www.google.com/recaptcha/api/siteverify?secret=${env.RECAPTCHA_SECRET_KEY}&response=${input.token}`,
  //         {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/x-www-form-urlencoded",
  //           },
  //         },
  //       );
  //       const data = (await response.json()) as { success: boolean };

  //       if (data.success) {
  //         return {
  //           success: true,
  //         };
  //       }

  //       return {
  //         success: false,
  //         msg: "Failed to verify",
  //       };
  //     } catch (error) {
  //       return {
  //         success: false,
  //         msg: "Internal server error",
  //       };
  //     }
  //   }),
} satisfies TRPCRouterRecord;
