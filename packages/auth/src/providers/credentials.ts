import CredentialsProvider from "@auth/core/providers/credentials";
import moment from "moment";
import { z } from "zod";

import { db, Prisma } from "@fulltemplate/db";
import { createEvent } from "@fulltemplate/event";
import { getAppConfig } from "@fulltemplate/helpers/src/config";
import { GetRequestDetailsResult } from "@fulltemplate/helpers/src/request-details";

import type { UserRole } from "../types";
import { InvalidLoginError } from "../error";
import { caller } from "../server";
import { noRememberMaxAge, rememberMaxAge } from "../utils";

const CustomCredentialsProvider = (reqDetails?: GetRequestDetailsResult) => {
  return CredentialsProvider({
    id: "credentials",
    name: "Credentials",
    credentials: {
      email: {
        type: "text",
      },
      password: {
        type: "password",
      },
    },
    async authorize(credentials) {
      try {
        const loginSchema = z.object({
          email: z.string().email(),
          password: z.string(),
          remember: z.string().optional(),
        });
        const loginResult = await loginSchema.safeParseAsync(credentials);
        if (!loginResult.success) {
          await createEvent({
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: "validation",
            metadata: JSON.stringify(credentials),
            reqDetails: reqDetails,
          });
          return null;
        }
        const { email, password, remember } = loginResult.data;

        const user = await db.user.findFirst({
          where: {
            email: email,
          },
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
        });
        if (!user) {
          await createEvent({
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: "no-user",
            reqDetails: reqDetails,
          });
          return null;
        }

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

        const matchResult = await caller.auth.matchPassword({
          password: password,
          accountPassword: account.password,
        });

        // An error happened
        if (!matchResult.success) {
          await createEvent({
            userId: user.id,
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: "match-password-error",
            reqDetails: reqDetails,
          });
          throw new InvalidLoginError("internal-error");
        }

        const appConfig = await getAppConfig();

        // Passwords did not match
        if (!matchResult.match) {
          if (appConfig.isLockAccountEnabled) {
            const appLoginAttemptConfigs = await db.loginAttemptConfig.findMany(
              {
                orderBy: [{ isLockPermanent: "asc" }, { attemptCount: "asc" }],
              },
            );

            let shouldLockAccount = false;
            let lockUntilAt = null;

            for (const config of appLoginAttemptConfigs) {
              if (userConfig.failedAttemptsCount < config.attemptCount) {
                break;
              }

              if (userConfig.failedAttemptsCount === config.attemptCount) {
                if (config.isLockPermanent) {
                  await db.userConfig.update({
                    where: {
                      id: userConfig.id,
                    },
                    data: {
                      bannedAt: new Date(),
                      banReason: null,
                      banExpiresAt: null,
                      failedAttemptsCount: {
                        increment: 1,
                      },
                      lastFailedAttemptAt: new Date(),
                    },
                  });

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
                } else {
                  lockUntilAt = moment()
                    .add(config.lockDuration, "minutes")
                    .toDate();
                  shouldLockAccount = true;
                }
              }
            }

            if (shouldLockAccount) {
              await db.userConfig.update({
                where: { id: userConfig.id },
                data: {
                  bannedAt: new Date(),
                  banReason: null,
                  banExpiresAt: lockUntilAt,
                  failedAttemptsCount: {
                    increment: 1,
                  },
                  lastFailedAttemptAt: moment().toDate(),
                },
              });

              await createEvent({
                userId: user.id,
                category: "auth",
                type: "sign-in",
                action: "created",
                status: "failed",
                error: "account-temporarily-banned",
                reqDetails: reqDetails,
              });

              await db.session.deleteMany({
                where: {
                  userId: user.id,
                },
              });

              if (userConfig.banReason) {
                throw new InvalidLoginError(
                  `account-banned-${userConfig.banReason}`,
                );
              }
              throw new InvalidLoginError("account-banned");
            }
          }

          await db.userConfig.update({
            where: {
              id: userConfig.id,
            },
            data: {
              failedAttemptsCount: {
                increment: 1,
              },
              lastFailedAttemptAt: moment().toDate(),
            },
          });

          await createEvent({
            userId: user.id,
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: "match-password-error",
            reqDetails: reqDetails,
          });

          return null;
        }

        if (
          appConfig.authProviders.map((p) => p.provider).includes("two-factor")
        ) {
          const enabledAuthenticators = user.twoFactorAuthentications.filter(
            (auth) => auth.isEnabled,
          );
          if (enabledAuthenticators.length > 0) {
            throw new InvalidLoginError("enter-2fa");
          }
        }

        await db.userConfig.update({
          where: {
            id: userConfig.id,
          },
          data: {
            failedAttemptsCount: 0,
          },
        });

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

export default CustomCredentialsProvider;
