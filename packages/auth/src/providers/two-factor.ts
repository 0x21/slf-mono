import CredentialsProvider from "@auth/core/providers/credentials";
import moment from "moment";
import { z } from "zod";

import { db, Prisma } from "@fulltemplate/db";
import { createEvent } from "@fulltemplate/event";
import { GetRequestDetailsResult } from "@fulltemplate/helpers/src/request-details";

import type { UserRole } from "../types";
import { InvalidLoginError } from "../error";
import { caller } from "../server";
import { noRememberMaxAge, rememberMaxAge } from "../utils";

const TwoFactorProvider = (reqDetails?: GetRequestDetailsResult) => {
  return CredentialsProvider({
    id: "two-factor",
    name: "Two Factor",
    credentials: {},
    async authorize(credentials) {
      try {
        const loginSchema = z.object({
          twoFactorToken: z.string(),
          totp: z.string().length(6).optional(),
          backupCode: z.string().length(8).optional(),
          remember: z.string().optional(),
        });
        const loginResult = await loginSchema.safeParseAsync(credentials);
        if (!loginResult.success) {
          // TODO specify two-factor
          await createEvent({
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: "validation",
            reqDetails: reqDetails,
          });
          return null;
        }
        const { twoFactorToken, totp, backupCode, remember } = loginResult.data;

        const twoFactor = await db.twoFactorToken.findFirst({
          where: {
            token: twoFactorToken,
          },
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                email: true,
                image: true,
                role: true,
                twoFactorAuthentications: {
                  select: {
                    isEnabled: true,
                    secret: true,
                  },
                },
              },
            },
          },
        });
        if (!twoFactor) {
          // TODO
          await createEvent({
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: "validation",
            reqDetails: reqDetails,
          });
          return null;
        }

        const user = twoFactor.user;

        const account = await db.account.findFirst({
          where: {
            userId: user.id,
            provider: "credentials",
            type: "email",
          },
          select: {
            id: true,
            password: true,
          },
        });
        if (!account) {
          // TODO specify two-factor
          await createEvent({
            userId: user.id,
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: "no-account",
            reqDetails: reqDetails,
          });
          return null;
        }
        if (!account.password) {
          // TODO specify two-factor
          await createEvent({
            userId: user.id,
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: "no-account-password",
            reqDetails: reqDetails,
          });
          return null;
        }

        let userConfig = await db.userConfig.findFirst({
          where: {
            userId: user.id,
          },
        });
        if (!userConfig) {
          userConfig = await db.userConfig.create({
            data: {
              userId: user.id,
            },
          });
        }

        // this check is here to return custom error message
        if (userConfig.bannedAt && userConfig.banExpiresAt === null) {
          // TODO specify two-factor
          await createEvent({
            userId: user.id,
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: "account-permanently-banned",
            reqDetails: reqDetails,
          });

          if (userConfig.banReason) {
            throw new InvalidLoginError(
              `account-banned-${userConfig.banReason}`,
            );
          }
          throw new InvalidLoginError("account-banned");
        }

        // this check is here to return custom error message
        if (userConfig.bannedAt && userConfig.banExpiresAt !== null) {
          if (moment().isAfter(userConfig.banExpiresAt)) {
            await db.userConfig.update({
              where: {
                id: userConfig.id,
              },
              data: {
                bannedAt: null,
                banReason: null,
                banExpiresAt: null,
              },
            });
          } else {
            // TODO specify two-factor
            await createEvent({
              userId: user.id,
              category: "auth",
              type: "sign-in",
              action: "created",
              status: "failed",
              error: "account-temporarily-banned",
              reqDetails: reqDetails,
            });

            if (userConfig.banReason) {
              throw new InvalidLoginError(
                `account-banned-${userConfig.banReason}`,
              );
            }
            throw new InvalidLoginError("account-banned");
          }
        }

        if (totp === undefined) {
          const authenticator = user.twoFactorAuthentications.find(
            (auth) => auth.isEnabled,
          );
          if (authenticator) {
            const backupCodes = await db.twoFactorBackupCode.findMany({
              where: {
                userId: user.id,
                used: false,
              },
              select: {
                id: true,
                code: true,
              },
            });

            if (backupCodes.length === 0) {
              throw new InvalidLoginError("invalid-backup-code");
            }

            const hashedCodes = backupCodes.map((bc) => {
              return bc.code;
            });

            const result = await caller.auth.matchBackupCodes({
              code: backupCode!,
              hashedCodes: hashedCodes,
            });
            if (!result.success) {
              // TODO specify two-factor
              await createEvent({
                userId: user.id,
                category: "auth",
                type: "sign-in",
                action: "created",
                status: "failed",
                error: "match-backup-code-error",
                reqDetails: reqDetails,
              });
              throw new InvalidLoginError("invalid-backup-code");
            }

            const bc = backupCodes.find((bc) => bc.code === result.data);
            if (!bc) {
              throw new InvalidLoginError("invalid-backup-code");
            }

            await db.twoFactorBackupCode.update({
              where: {
                id: bc.id,
              },
              data: {
                used: true,
              },
            });
          }
        } else {
          const authenticator = user.twoFactorAuthentications.find(
            (auth) => auth.isEnabled,
          );
          if (authenticator) {
            const result = await caller.auth.verifyTwoFactorAuth({
              secret: authenticator.secret,
              token: totp,
            });
            if (!result.success) {
              // TODO specify two-factor
              await createEvent({
                userId: user.id,
                category: "auth",
                type: "sign-in",
                action: "created",
                status: "failed",
                error: "invalid-2fa",
                reqDetails: reqDetails,
              });
              throw new InvalidLoginError("invalid-2fa");
            }
          }
        }

        const maxAge = remember === "true" ? rememberMaxAge : noRememberMaxAge;
        return {
          ...user,
          maxAge: maxAge,
          role: user.role as UserRole,
        };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientInitializationError ||
          error instanceof Prisma.PrismaClientKnownRequestError
        ) {
          throw new InvalidLoginError("internal-error");
        }
        throw error;
      }
    },
  });
};

export default TwoFactorProvider;
