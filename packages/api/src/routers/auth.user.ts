import type { TRPCRouterRecord } from "@trpc/server";
import moment from "moment";
import QRCode from "qrcode";
import speakeasy from "speakeasy";
import { v4 } from "uuid";
import { z } from "zod";

import { BRAND_TITLE } from "@fulltemplate/common";
import { createEvent } from "@fulltemplate/event";
import { getAppConfig } from "@fulltemplate/helpers/src/config";
import { getRequestDetails } from "@fulltemplate/helpers/src/request-details";

import { caller } from "../server";
import { protectedProcedure } from "../trpc";

export const authUserRouter = {
  getSession: protectedProcedure.mutation(({ ctx }) => {
    return ctx.session.user;
  }),
  getUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.db.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        image: true,
      },
    });
    return user;
  }),
  getUserConfig: protectedProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.userConfig.findFirst({
        where: {
          user: {
            email: input.email,
          },
        },
        select: {
          id: true,
          bannedAt: true,
          banReason: true,
          banExpiresAt: true,
          sudoModeExpiresAt: true,
          requiresPasswordChange: true,
          requiresTwoFactorAuth: true,
        },
      });

      return user;
    }),
  getAuthenticator: protectedProcedure.query(async ({ ctx }) => {
    const authenticator = await ctx.db.twoFactorAuthentication.findFirst({
      where: {
        userId: ctx.session.user.id,
      },
    });

    if (!authenticator) {
      return {
        success: false,
        msg: "No authenticator",
      };
    }
    if (!authenticator.isEnabled) {
      return {
        success: false,
        msg: "No authenticator",
      };
    }

    return { success: true };
  }),
  getFailedAttempts: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const events = await ctx.db.event.findMany({
      where: {
        userId: userId,
        type: "sign-in",
        status: "failed",
        error: {
          in: ["invalid-2fa", "match-password-error"],
        },
      },
      select: {
        id: true,
        country: true,
        city: true,
        region: true,
        ip: true,
        latitude: true,
        longitude: true,
        postalCode: true,
        continent: true,
        regionCode: true,
        userAgent: true,
        environment: true,
        error: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return events;
  }),
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const sessions = await ctx.db.session.findMany({
      where: {
        userId: userId,
        impersonatedById: null,
      },
      select: {
        id: true,
        country: true,
        city: true,
        region: true,
        ip: true,
        latitude: true,
        longitude: true,
        postalCode: true,
        continent: true,
        regionCode: true,
        userAgent: true,
        environment: true,
        expires: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sessions;
  }),
  deleteSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await ctx.db.session.delete({
        where: {
          id: input.sessionId,
          userId: userId,
        },
      });

      return {
        success: true,
      };
    }),
  deleteSessions: protectedProcedure
    .input(
      z.object({
        sessionIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      for (const sessionId of input.sessionIds) {
        await ctx.db.session.delete({
          where: {
            id: sessionId,
            userId: userId,
          },
        });
      }

      return {
        success: true,
      };
    }),
  changePassword: protectedProcedure
    .input(
      z.object({
        existingPassword: z.string(),
        newPassword: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const reqDetails = await getRequestDetails();

      const account = await ctx.db.account.findFirst({
        where: {
          userId: userId,
          provider: "credentials",
          type: "email",
        },
        select: {
          id: true,
          password: true,
        },
      });

      if (!account) {
        return {
          success: false,
          msg: "No account!",
        };
      }

      if (!account.password) {
        await createEvent({
          userId: userId,
          category: "auth",
          type: "change-password",
          action: "created",
          status: "failed",
          error: "no-account-password",
          reqDetails: reqDetails,
        });
        return {
          success: false,
          msg: "Account has no password!",
        };
      }

      const matchResult = await caller.auth.matchPassword({
        password: input.existingPassword,
        accountPassword: account.password,
      });
      if (!matchResult.success) {
        await createEvent({
          userId: userId,
          category: "auth",
          type: "change-password",
          action: "created",
          status: "failed",
          error: "match-password-error",
          reqDetails: reqDetails,
        });
        return {
          success: false,
          msg: "Something went wrong! Please try again later.",
        };
      }

      if (!matchResult.match) {
        await createEvent({
          userId: userId,
          category: "auth",
          type: "change-password",
          action: "created",
          status: "failed",
          error: "match-password-match-error",
          reqDetails: reqDetails,
        });
        return {
          success: false,
          msg: "Existing password is incorrect",
        };
      }

      const hashResult = await caller.auth.hashPassword({
        password: input.newPassword,
      });
      if (!hashResult.success) {
        await createEvent({
          userId: userId,
          category: "auth",
          type: "change-password",
          action: "created",
          status: "failed",
          error: "hash-password-error",
          reqDetails: reqDetails,
        });
        return {
          success: false,
          msg: "Something went wrong! Please try again later.",
        };
      }

      await ctx.db.account.update({
        where: {
          id: account.id,
        },
        data: {
          password: hashResult.data,
        },
      });

      await ctx.db.userConfig.upsert({
        where: {
          userId: userId,
        },
        update: {
          requiresPasswordChange: false,
        },
        create: {
          userId: userId,
          requiresPasswordChange: false,
        },
      });

      await ctx.db.session.deleteMany({
        where: {
          userId: userId,
        },
      });

      return {
        success: true,
      };
    }),

  updateUserInfo: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        image: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const reqDetails = await getRequestDetails();

      const user = await ctx.db.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          id: true,
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "User not found!",
        };
      }

      await ctx.db.user.update({
        where: {
          id: userId,
        },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          image: input.image !== "" ? input.image : null,
        },
      });

      await createEvent({
        userId: userId,
        category: "account",
        type: "update-information",
        action: "created",
        status: "success",
        reqDetails: reqDetails,
      });

      return {
        success: true,
      };
    }),
  updateUserImage: protectedProcedure
    .input(
      z.object({
        url: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const reqDetails = await getRequestDetails();

      const user = await ctx.db.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          id: true,
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "User not found!",
        };
      }

      await ctx.db.user.update({
        where: {
          id: userId,
        },
        data: {
          image: input.url === "" ? null : input.url,
        },
      });

      await createEvent({
        userId: userId,
        category: "account",
        type: "update-information",
        action: "created",
        status: "success",
        metadata: "updated-image",
        reqDetails: reqDetails,
      });

      return {
        success: true,
        data: {
          user: {
            image: input.url,
          },
        },
      };
    }),

  checkEmailVerification: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.db.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        emailVerified: true,
        email: true,
      },
    });

    if (!user) {
      return {
        success: false,
        msg: "No user!",
      };
    }

    const twoHoursAgo = moment(new Date()).subtract(2, "hours");

    const recentEvents = await ctx.db.event.findMany({
      where: {
        category: "email",
        type: "verify",
        createdAt: {
          gte: twoHoursAgo.toDate(),
        },
        metadata: {
          contains: `verify:${user.email}`,
        },
      },
    });

    return {
      success: true,
      data: {
        verified: !!user.emailVerified,
        existEmail: recentEvents.length > 0,
      },
    };
  }),
  request2FA: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const existing2FA = await ctx.db.twoFactorAuthentication.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!existing2FA) {
      const secret = speakeasy.generateSecret({
        name: BRAND_TITLE,
      });
      await ctx.db.twoFactorAuthentication.create({
        data: {
          userId: userId,
          secret: secret.base32,
        },
      });
      const otpUrl = `otpauth://totp/${ctx.session.user.email!}?secret=${secret.base32}`;
      const data = await QRCode.toDataURL(otpUrl);
      return {
        success: true,
        qrcode: data,
        secret: secret.base32,
      };
    }

    if (existing2FA.isEnabled) {
      return {
        success: false,
        msg: "Two-factor authentication method already enabled.",
      };
    }

    const otpUrl = `otpauth://totp/${ctx.session.user.email!}?secret=${existing2FA.secret}`;

    const data = await QRCode.toDataURL(otpUrl);

    return {
      success: true,
      qrcode: data,
      secret: existing2FA.secret,
    };
  }),
  enable2FA: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const existing2FA = await ctx.db.twoFactorAuthentication.findFirst({
        where: {
          userId: userId,
        },
      });

      if (!existing2FA) {
        return { success: false, msg: "No authenticator!" };
      }

      const result = await caller.auth.verifyTwoFactorAuth({
        secret: existing2FA.secret,
        token: input.token,
      });

      if (!result.success) {
        return {
          success: false,
          msg: "Invalid code",
        };
      }
      await ctx.db.twoFactorAuthentication.update({
        where: {
          id: existing2FA.id,
        },
        data: {
          isEnabled: true,
        },
      });

      await ctx.db.userConfig.upsert({
        where: {
          userId: userId,
        },
        update: {
          requiresTwoFactorAuth: false,
        },
        create: {
          userId: userId,
          requiresTwoFactorAuth: false,
        },
      });

      return {
        success: true,
      };
    }),
  disable2FA: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.user.findFirst({
      where: {
        id: ctx.session.user.id,
      },
      select: {
        id: true,
        twoFactorAuthentications: {
          select: {
            id: true,
          },
        },
        twoFactorBackupCodes: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!user) {
      return { success: false, msg: "No user" };
    }

    if (user.twoFactorAuthentications.length === 0) {
      return {
        success: false,
        msg: "No authenticators",
      };
    }

    await ctx.db.twoFactorAuthentication.deleteMany({
      where: {
        userId: user.id,
      },
    });

    if (user.twoFactorBackupCodes.length > 0) {
      await ctx.db.twoFactorBackupCode.deleteMany({
        where: {
          userId: user.id,
        },
      });
    }

    return { success: true };
  }),
  sendVerifyEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.session.user;
    const reqDetails = await getRequestDetails();

    const twoHoursAgo = moment(new Date()).subtract(2, "hours");

    const recentEvents = await ctx.db.event.findMany({
      where: {
        category: "email",
        type: "verify",
        createdAt: {
          gte: twoHoursAgo.toDate(),
        },
        metadata: {
          contains: `verify:${user.email}`,
        },
      },
    });

    if (recentEvents.length > 0) {
      return {
        success: false,
        msg: "A verification mail has already been sent within the last two hours.",
      };
    }

    const account = await ctx.db.account.findFirst({
      where: {
        user: {
          id: user.id,
        },
      },
    });

    if (!account) {
      return { success: false, msg: "No account!" };
    }
    const otp = v4();
    // await ctx.db.verificationToken.deleteMany({
    //   where: {
    //     email: ctx.session.user.email!,
    //     type: "email",
    //   },
    // });

    // await ctx.db.verificationToken.create({
    //   data: {
    //     email: ctx.session.user.email!,
    //     token: otp,
    //     type: "email",
    //     expiresAt: moment(new Date()).add(1, "day").toDate(),
    //   },
    // });

    const appConfig = await getAppConfig();
    if (appConfig.isEmailEnabled) {
      await caller.authMail.sendVerify({
        email: user.email!,
        firstName: user.firstName ?? null,
        otp: otp,
      });
    }

    await createEvent({
      category: "email",
      type: "verify",
      action: "created",
      status: "success",
      metadata: `verify:${user.email}`,
      reqDetails: reqDetails,
    });
    return { success: true };
  }),
  verify2FA: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const existing2FA = await ctx.db.twoFactorAuthentication.findFirst({
        where: {
          userId: userId,
        },
      });
      if (!existing2FA) {
        return { success: false, msg: "No authenticator!" };
      }

      const result = await caller.auth.verifyTwoFactorAuth({
        secret: existing2FA.secret,
        token: input.token,
      });

      if (!result.success) {
        return {
          success: false,
          msg: "Invalid code",
        };
      }
      return {
        success: true,
      };
    }),
  generateBackupCodes: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, "0");

      backupCodes.push(code);
    }

    const hashedCodes = await caller.auth.hashBackupCodes({
      codes: backupCodes,
    });
    if (!hashedCodes.success) {
      return {
        success: false,
        msg: "Something went wrong while backup codes generating",
      };
    }

    const backupCode = await ctx.db.twoFactorBackupCode.findFirst({
      where: {
        userId: userId,
      },
    });

    if (backupCode) {
      await ctx.db.twoFactorBackupCode.deleteMany({
        where: {
          userId: userId,
        },
      });
    }

    await ctx.db.twoFactorBackupCode.createMany({
      data: hashedCodes.data.map((code) => ({
        userId: userId,
        code: code,
        used: false,
      })),
    });

    return { success: true, data: backupCodes };
  }),
  deleteImpersonateToken: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    await ctx.db.impersonateToken.deleteMany({
      where: {
        impersonatingId: userId,
      },
    });

    return {
      success: true,
    };
  }),
  verifyPassword: protectedProcedure
    .input(
      z.object({
        password: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const account = await ctx.db.account.findFirst({
        where: {
          userId: userId,
          provider: "credentials",
          type: "email",
        },
        select: {
          id: true,
          password: true,
        },
      });

      if (!account) {
        // TODO
        return false;
      }

      if (!account.password) {
        // TODO
        return false;
      }

      const result = await caller.auth.matchPassword({
        password: input.password,
        accountPassword: account.password,
      });

      if (!result.success || !result.match) {
        // TODO
        return false;
      }

      await ctx.db.userConfig.upsert({
        where: {
          userId: userId,
        },
        update: {
          sudoModeExpiresAt: moment().add(30, "minutes").toDate(),
        },
        create: {
          userId: userId,
          sudoModeExpiresAt: moment().add(30, "minutes").toDate(),
        },
      });

      return true;
    }),
  getSudoModeStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const account = await ctx.db.account.findFirst({
      where: {
        userId: userId,
        provider: "credentials",
      },
    });
    if (!account) {
      return true;
    }

    const config = await ctx.db.userConfig.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!config?.sudoModeExpiresAt) {
      return false;
    }

    const sudoModeExpiresAt = moment(config.sudoModeExpiresAt);
    return !sudoModeExpiresAt.isBefore(moment());
  }),
} satisfies TRPCRouterRecord;
