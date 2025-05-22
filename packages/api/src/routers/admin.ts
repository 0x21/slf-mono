/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TRPCRouterRecord } from "@trpc/server";
import moment from "moment";
import { v4 } from "uuid";
import { z } from "zod";

import type { UserRole } from "@fulltemplate/auth/src/types";
import { getAdapter } from "@fulltemplate/auth/src/adapter";
import { ensureUserHasHigherRole } from "@fulltemplate/auth/src/client";
import { createEvent } from "@fulltemplate/event";
import { getAppConfig } from "@fulltemplate/helpers/src/config";
import { getRequestDetails } from "@fulltemplate/helpers/src/request-details";

import { caller } from "../server";
import { protectedAdminProcedure } from "../trpc";

export const adminRouter = {
  getDashboardData: protectedAdminProcedure.query(async ({ ctx }) => {
    const userRole = ctx.session.user.role;

    const today = moment();
    const oneMonthAgo = today.clone().subtract(1, "months");
    const twoMonthAgo = today.clone().subtract(2, "months");

    let users = await ctx.db.user.findMany({
      select: {
        id: true,
        createdAt: true,
        role: true,
      },
    });

    const appConfig = await getAppConfig();
    if (appConfig.isSuperadminHidden && userRole === "admin") {
      users = users.filter((user) => {
        return user.role !== "superadmin";
      });
    }

    const totalUserCount = users.length;

    const totalNewUserCount = users.filter((user) =>
      moment(user.createdAt).isAfter(oneMonthAgo),
    ).length;

    const lastOneMonthSignups = await ctx.db.event.count({
      where: {
        type: "register",
        status: "success",
        createdAt: {
          gte: oneMonthAgo.toDate(),
        },
      },
    });

    const lastTwoMonthSignups = await ctx.db.event.count({
      where: {
        type: "register",
        status: "success",
        createdAt: {
          gte: twoMonthAgo.toDate(),
        },
      },
    });
    const lastTwoMonthSignupDiff = lastTwoMonthSignups - lastOneMonthSignups;

    return {
      userCount: totalUserCount,
      newUsersCount: totalNewUserCount,
      lastMonthSignups: lastOneMonthSignups,
      lastTwoMonthSignupDiff: lastTwoMonthSignupDiff,
    };
  }),
  getUsers: protectedAdminProcedure.query(async ({ ctx }) => {
    let users = await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true,
        isAnonymous: true,
        updatedAt: true,
        createdAt: true,
        twoFactorAuthentications: {
          where: {
            isEnabled: true,
          },
          select: {
            id: true,
          },
        },
        config: {
          select: {
            id: true,
            bannedAt: true,
            banReason: true,
            banExpiresAt: true,
            requiresPasswordChange: true,
            requiresTwoFactorAuth: true,
          },
        },
        sessions: {
          select: {
            id: true,
            expires: true,
            createdAt: true,
          },
        },
        accounts: {
          select: {
            id: true,
            type: true,
            provider: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const userRole = ctx.session.user.role;
    const appConfig = await getAppConfig();

    if (appConfig.isSuperadminHidden && userRole === "admin") {
      users = users.filter((user) => {
        return user.role !== "superadmin";
      });
    }

    if (appConfig.isSuperadminRoleCloaked && userRole === "admin") {
      users = users.map((user) => {
        if (user.role === "superadmin") {
          return {
            ...user,
            role: "admin",
          };
        }
        return user;
      });
    }

    return users;
  }),
  getUserAccounts: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const accounts = await ctx.db.account.findMany({
        where: {
          userId: input.userId,
        },
        select: {
          id: true,
          type: true,
          provider: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return accounts;
    }),
  getUserSessions: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;
      const appConfig = await getAppConfig();

      const sessions = await ctx.db.session.findMany({
        where: {
          ...(appConfig.isSuperadminHidden && userRole === "admin"
            ? {
                impersonatedById: null,
              }
            : {}),
          userId: input.userId,
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
          impersonatedById: true,
          expires: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      return sessions;
    }),
  getUserEvents: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const events = await ctx.db.event.findMany({
        where: {
          userId: input.userId,
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              username: true,
              email: true,
              image: true,
              role: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          severity: true,
          source: true,
          category: true,
          type: true,
          action: true,
          status: true,
          metadata: true,
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
          updatedAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 500,
      });
      return events;
    }),
  getUserDetails: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;
      const appConfig = await getAppConfig();

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
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
          accounts: {
            select: {
              id: true,
              type: true,
              provider: true,
            },
          },
          config: {
            select: {
              id: true,
              bannedAt: true,
              banReason: true,
              banExpiresAt: true,
              requiresPasswordChange: true,
              requiresTwoFactorAuth: true,
            },
          },
          _count: {
            select: {
              sessions: {
                where: {
                  ...(appConfig.isSuperadminHidden && userRole === "admin"
                    ? {
                        impersonatedById: null,
                      }
                    : {}),
                },
              },
              accounts: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      if (
        appConfig.isSuperadminHidden &&
        userRole === "admin" &&
        user.role === "superadmin"
      ) {
        return null;
      }

      if (
        appConfig.isSuperadminRoleCloaked &&
        userRole === "admin" &&
        user.role === "superadmin"
      ) {
        user.role = "admin";
      }

      return user;
    }),
  deleteSession: protectedAdminProcedure
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      if (ctx.session.id === input.sessionId) {
        return {
          success: false,
          msg: "You cannot delete your current session.",
        };
      }

      const user = await ctx.db.user.findFirst({
        where: {
          sessions: {
            some: {
              id: input.sessionId,
            },
          },
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "No user",
        };
      }

      if (
        currentUser.id !== user.id &&
        !ensureUserHasHigherRole(
          currentUser.role as UserRole,
          user.role as UserRole,
        )
      ) {
        return {
          success: false,
          msg: "You don't have permission to delete this session.",
        };
      }

      await ctx.db.session.delete({
        where: {
          id: input.sessionId,
        },
      });

      return {
        success: true,
      };
    }),
  deleteSessions: protectedAdminProcedure
    .input(
      z.object({
        sessionIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      if (input.sessionIds.includes(ctx.session.id)) {
        return {
          success: false,
          msg: "You cannot delete your current session.",
        };
      }

      const sessions = await ctx.db.session.findMany({
        where: {
          id: {
            in: input.sessionIds,
          },
        },
        select: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      if (sessions.length === 0) {
        return {
          success: false,
          msg: "No user!",
        };
      }

      for (const session of sessions) {
        const user = session.user;
        if (
          currentUser.id !== user.id &&
          !ensureUserHasHigherRole(
            currentUser.role as UserRole,
            user.role as UserRole,
          )
        ) {
          return {
            success: false,
            msg: `You don't have permission to delete ${user.email}'s session.`,
          };
        }
      }

      await ctx.db.session.deleteMany({
        where: {
          id: {
            in: input.sessionIds,
          },
        },
      });

      return {
        success: true,
        msg: "Sessions deleted.",
      };
    }),

  deleteUserSessions: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      if (currentUser.id === input.userId) {
        return {
          success: false,
          msg: "You cannot delete your sessions here. Please manage them in your settings.",
        };
      }

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "No user",
        };
      }

      if (
        !ensureUserHasHigherRole(
          currentUser.role as UserRole,
          user.role as UserRole,
        )
      ) {
        return {
          success: false,
          msg: "You don't have permission to delete this user's sessions.",
        };
      }

      await ctx.db.session.deleteMany({
        where: {
          userId: input.userId,
        },
      });

      return {
        success: true,
      };
    }),
  getSignups: protectedAdminProcedure
    .input(
      z.object({
        fromDate: z.string().date(),
        toDate: z.string().date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;
      const appConfig = await getAppConfig();

      const now = moment(new Date());
      const fromDateMoment = moment(input.fromDate);
      const fromDate = fromDateMoment.toDate();
      let toDateMoment = moment(input.toDate ?? new Date());
      toDateMoment =
        toDateMoment.format("YYYY-MM-DD") === now.format("YYYY-MM-DD")
          ? now
          : toDateMoment;
      const toDate = toDateMoment.toDate();

      const data = await ctx.db.event.findMany({
        where: {
          user:
            appConfig.isSuperadminHidden && userRole === "admin"
              ? {
                  role: {
                    not: "superadmin",
                  },
                }
              : {},
          type: "register",
          status: "success",
          AND: [
            {
              createdAt: {
                gte: fromDate,
              },
            },
            {
              createdAt: {
                lte: toDate,
              },
            },
          ],
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const result: {
        index: number;
        count: number;
        createdAt: string;
      }[] = [];

      const dayStartMoment = moment(fromDate);
      const dayEndMoment = moment(toDate);
      let index = 0;

      while (
        dayStartMoment.isBefore(dayEndMoment) ||
        dayStartMoment.isSame(dayEndMoment, "day")
      ) {
        const dayStart = new Date(
          dayStartMoment.startOf("day").toDate().getTime(),
        );
        const dayEnd = new Date(dayStartMoment.endOf("day").toDate().getTime());

        const dayData = data.filter((event) =>
          moment(event.createdAt).isBetween(dayStart, dayEnd, undefined, "[)"),
        );

        result.push({
          index: index,
          count: dayData.length,
          createdAt: dayStartMoment.startOf("day").toISOString(),
        });

        dayStartMoment.add(1, "day");
        index += 1;
      }
      return result;
    }),
  getDailyActiveUsers: protectedAdminProcedure
    .input(
      z.object({
        fromDate: z.string().date(),
        toDate: z.string().date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;
      const appConfig = await getAppConfig();

      const now = moment(new Date());
      const fromDateMoment = moment(input.fromDate);
      const fromDate = fromDateMoment.toDate();
      let toDateMoment = moment(input.toDate ?? new Date());
      toDateMoment =
        toDateMoment.format("YYYY-MM-DD") === now.format("YYYY-MM-DD")
          ? now
          : toDateMoment;
      const toDate = toDateMoment.toDate();

      const data = await ctx.db.event.findMany({
        where: {
          user:
            appConfig.isSuperadminHidden && userRole === "admin"
              ? {
                  role: {
                    not: "superadmin",
                  },
                }
              : {},
          type: "sign-in",
          status: "success",
          AND: [
            {
              createdAt: {
                gte: fromDate,
              },
            },
            {
              createdAt: {
                lte: toDate,
              },
            },
          ],
        },
        orderBy: {
          createdAt: "asc",
        },
        distinct: ["userId"],
      });

      const result: {
        index: number;
        count: number;
        createdAt: string;
      }[] = [];

      const dayStartMoment = moment(fromDate);
      const dayEndMoment = moment(toDate);

      let index = 0;

      while (
        dayStartMoment.isBefore(dayEndMoment) ||
        dayStartMoment.isSame(dayEndMoment, "day")
      ) {
        const dayStart = new Date(
          dayStartMoment.startOf("day").toDate().getTime(),
        );
        const dayEnd = new Date(dayStartMoment.endOf("day").toDate().getTime());

        const dayData = data.filter((event) =>
          moment(event.createdAt).isBetween(dayStart, dayEnd, undefined, "[)"),
        );

        result.push({
          index: index,
          count: dayData.length,
          createdAt: dayStartMoment.startOf("day").toISOString(),
        });

        dayStartMoment.add(1, "day");
        index += 1;
      }

      return result;
    }),
  getFailedAttempts: protectedAdminProcedure
    .input(
      z.object({
        fromDate: z.string().date(),
        toDate: z.string().date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;
      const appConfig = await getAppConfig();

      const now = moment(new Date());
      const fromDateMoment = moment(input.fromDate);
      const fromDate = fromDateMoment.toDate();
      let toDateMoment = moment(input.toDate ?? new Date());
      toDateMoment =
        toDateMoment.format("YYYY-MM-DD") === now.format("YYYY-MM-DD")
          ? now
          : toDateMoment;
      const toDate = toDateMoment.toDate();

      const data = await ctx.db.event.findMany({
        where: {
          user:
            appConfig.isSuperadminHidden && userRole === "admin"
              ? {
                  role: {
                    not: "superadmin",
                  },
                }
              : {},
          type: "sign-in",
          status: "failed",
          error: {
            in: ["invalid-2fa", "match-password-error"],
          },
          AND: [
            {
              createdAt: {
                gte: fromDate,
              },
            },
            {
              createdAt: {
                lte: toDate,
              },
            },
          ],
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const result: {
        index: number;
        attempts: number;
        createdAt: string;
      }[] = [];

      const dayStartMoment = moment(fromDate);
      const dayEndMoment = moment(toDate);
      let index = 0;

      while (
        dayStartMoment.isBefore(dayEndMoment) ||
        dayStartMoment.isSame(dayEndMoment, "day")
      ) {
        const dayStart = new Date(
          dayStartMoment.startOf("day").toDate().getTime(),
        );
        const dayEnd = new Date(dayStartMoment.endOf("day").toDate().getTime());

        const dayData = data.filter((attempt) =>
          moment(attempt.createdAt).isBetween(
            dayStart,
            dayEnd,
            undefined,
            "[)",
          ),
        );

        result.push({
          index: index,
          attempts: dayData.length,
          createdAt: dayStartMoment.startOf("day").toISOString(),
        });

        dayStartMoment.add(1, "day");
        index += 1;
      }

      return result;
    }),
  getUserRetentions: protectedAdminProcedure
    .input(
      z.object({
        fromDate: z.string().date(),
        toDate: z.string().date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;

      const now = moment(new Date());
      const fromDateMoment = moment(input.fromDate);
      const fromDate = fromDateMoment.toDate();
      let toDateMoment = moment(input.toDate ?? new Date());
      toDateMoment =
        toDateMoment.format("YYYY-MM-DD") === now.format("YYYY-MM-DD")
          ? now
          : toDateMoment;
      const toDate = toDateMoment.toDate();

      const appConfig = await getAppConfig();
      const sessions = await ctx.db.session.findMany({
        where: {
          user:
            appConfig.isSuperadminHidden && userRole === "admin"
              ? {
                  role: {
                    not: "superadmin",
                  },
                }
              : {},
          updatedAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
      });

      const result: {
        index: number;
        date: string;
        activeUsers: number;
        totalUsers: number;
        retentionRate: number;
      }[] = [];

      const dayStartMoment = moment(fromDate);
      const dayEndMoment = moment(toDate);
      let index = 0;

      while (
        dayStartMoment.isBefore(dayEndMoment) ||
        dayStartMoment.isSame(dayEndMoment, "day")
      ) {
        const dayStart = new Date(
          dayStartMoment.startOf("day").toDate().getTime(),
        );
        const dayEnd = new Date(dayStartMoment.endOf("day").toDate().getTime());

        const activeUsersSet = new Set(
          sessions
            .filter((session) =>
              moment(session.updatedAt).isBetween(
                dayStart,
                dayEnd,
                undefined,
                "[)",
              ),
            )
            .map((session) => session.userId),
        );

        const activeUsers = activeUsersSet.size;
        const totalUsers = await ctx.db.user.count({
          where: {
            createdAt: {
              lte: dayEnd,
            },
          },
        });
        result.push({
          index: index,
          date: dayStartMoment.startOf("day").format("YYYY-MM-DD"),
          activeUsers,
          totalUsers,
          retentionRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
        });

        dayStartMoment.add(1, "day");
        index += 1;
      }

      return result;
    }),
  getEvents: protectedAdminProcedure
    .input(
      z.object({
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cursor = input.cursor ?? 0;
      const limit = 500;

      const appConfig = await getAppConfig();
      const events = await ctx.db.event.findMany({
        where:
          appConfig.isSuperadminHidden && ctx.session.user.role === "admin"
            ? {
                user: {
                  role: {
                    not: "superadmin",
                  },
                },
              }
            : {},
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              username: true,
              email: true,
              image: true,
              role: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          severity: true,
          source: true,
          category: true,
          type: true,
          action: true,
          status: true,
          metadata: true,
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
          updatedAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit + 1,
        skip: cursor * limit,
      });

      let nextCursor: number | null = null;
      if (events.length > limit) {
        const nextItem = events.pop();
        nextCursor = nextItem ? cursor + 1 : null;
      }

      const eventCount = await ctx.db.event.count();

      return {
        events: events,
        totalCount: eventCount,
        nextCursor: nextCursor,
      };
    }),
  deleteEvent: protectedAdminProcedure
    .input(
      z.object({
        eventId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      const event = await ctx.db.event.findFirst({
        where: {
          id: input.eventId,
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      if (!event) {
        return {
          success: false,
          msg: "No event!",
        };
      }

      if (event.user) {
        if (
          currentUser.id !== event.user.id &&
          !ensureUserHasHigherRole(
            currentUser.role as UserRole,
            event.user.role as UserRole,
          )
        ) {
          return {
            success: false,
            msg: `You don't have permission to delete ${event.user.email}'s event.`,
          };
        }
      }

      await ctx.db.event.delete({
        where: {
          id: input.eventId,
        },
      });

      return {
        success: true,
      };
    }),
  deleteEvents: protectedAdminProcedure
    .input(
      z.object({
        eventIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      const events = await ctx.db.event.findMany({
        where: {
          id: {
            in: input.eventIds,
          },
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      if (events.length === 0) {
        return {
          success: false,
          msg: "No events!",
        };
      }

      for (const event of events) {
        if (event.user) {
          if (
            currentUser.id !== event.user.id &&
            !ensureUserHasHigherRole(
              currentUser.role as UserRole,
              event.user.role as UserRole,
            )
          ) {
            return {
              success: false,
              msg: `You don't have permission to delete ${event.user.email}'s event.`,
            };
          }
        }
      }

      await ctx.db.event.deleteMany({
        where: {
          id: {
            in: input.eventIds,
          },
        },
      });
      return {
        success: true,
      };
    }),
  deleteUser: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const role = ctx.session.user.role;

      if (input.userId === ctx.session.user.id) {
        return {
          success: false,
          msg: "You cannot delete yourself!",
        };
      }

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          memberOfOrganization: {
            select: {
              organization: {
                select: {
                  id: true,
                  members: {
                    select: {
                      id: true,
                      userId: true,
                      role: true,
                      createdAt: true,
                    },
                    orderBy: {
                      createdAt: "asc",
                    },
                  },
                },
              },
              role: true,
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "No user",
        };
      }

      if (!ensureUserHasHigherRole(role, user.role as UserRole)) {
        return {
          success: false,
          msg: `You don't have permission to delete "${user.email}"`,
        };
      }

      for (const member of user.memberOfOrganization) {
        const organization = member.organization;
        const members = organization.members;

        if (members.length === 1) {
          await ctx.db.organization.delete({
            where: {
              id: organization.id,
            },
          });
        } else if (member.role === "owner") {
          const newOwner = members.find((m) => m.userId !== user.id);
          if (newOwner) {
            await ctx.db.organizationMember.update({
              where: {
                id: newOwner.id,
              },
              data: {
                role: "owner",
              },
            });
          }
        }
      }

      await ctx.db.user.delete({
        where: {
          id: user.id,
        },
      });

      return {
        success: true,
      };
    }),
  deleteUsers: protectedAdminProcedure
    .input(
      z.object({
        userIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const role = ctx.session.user.role;
      const userId = ctx.session.user.id;

      if (input.userIds.includes(userId)) {
        return {
          success: false,
          msg: "You cannot delete yourself!",
        };
      }

      const users = await ctx.db.user.findMany({
        where: {
          id: {
            in: input.userIds,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          memberOfOrganization: {
            select: {
              organization: {
                select: {
                  id: true,
                  members: {
                    select: {
                      id: true,
                      userId: true,
                      role: true,
                      createdAt: true,
                    },
                    orderBy: {
                      createdAt: "asc",
                    },
                  },
                },
              },
              role: true,
            },
          },
        },
      });

      if (users.length === 0) {
        return {
          success: false,
          msg: "No user!",
        };
      }

      for (const user of users) {
        if (!ensureUserHasHigherRole(role, user.role as UserRole)) {
          return {
            success: false,
            msg: `You don't have permission to delete "${user.email}"`,
          };
        }
      }

      for (const user of users) {
        for (const member of user.memberOfOrganization) {
          const organization = member.organization;
          const members = organization.members;

          if (members.length === 1) {
            await ctx.db.organization.delete({
              where: {
                id: organization.id,
              },
            });
          } else if (member.role === "owner") {
            const newOwner = members.find((m) => m.userId !== user.id);
            if (newOwner) {
              await ctx.db.organizationMember.update({
                where: {
                  id: newOwner.id,
                },
                data: {
                  role: "owner",
                },
              });
            }
          }
        }

        await ctx.db.user.delete({
          where: {
            id: user.id,
          },
        });
      }

      return {
        success: true,
        msg: "Users deleted!",
      };
    }),
  createUser: protectedAdminProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        role: z.enum(["user", "admin"]),
        password: z.string().min(6),
        requiresPasswordChange: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const reqDetails = await getRequestDetails();
      const appConfig = await getAppConfig();
      const adapter = getAdapter(reqDetails);

      const role = ctx.session.user.role;

      if (!appConfig.canAdminCreateUsers && role === "admin") {
        return {
          success: false,
          msg: "You don't have permission to create users.",
        };
      }

      if (input.role === "admin" && role === "admin") {
        return {
          success: false,
          msg: "You don't have permission to create admin users.",
        };
      }

      let user = await adapter.getUserByEmail!(input.email);
      if (!user) {
        user = await adapter.createUser!({
          id: v4(),
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          name: [input.firstName, input.lastName].join(" "),
          emailVerified: new Date(),
          role: input.role,
        });
        await ctx.db.userConfig.create({
          data: {
            userId: user.id,
            requiresPasswordChange: input.requiresPasswordChange,
          },
        });
      } else {
        const account = await ctx.db.account.findFirst({
          where: {
            userId: user.id,
          },
        });

        if (account) {
          await createEvent({
            userId: user.id,
            category: "auth",
            type: "register",
            action: "created",
            status: "failed",
            error: "admin:email-already-in-use",
            reqDetails: reqDetails,
          });
          return {
            success: false,
            msg: "This email is already used!",
          };
        }
      }

      const result = await caller.auth.hashPassword({
        password: input.password,
      });
      if (!result.success) {
        await createEvent({
          userId: user.id,
          category: "auth",
          type: "register",
          action: "created",
          status: "failed",
          error: "admin:hash-password-error",
          reqDetails: reqDetails,
        });
        return {
          success: false,
          msg: "Something went wrong! Please try again later.",
        };
      }

      await adapter.linkAccount!({
        providerAccountId: null,
        userId: user.id,
        type: "email",
        provider: "credentials",
        password: result.data,
      });

      // await ctx.db.verificationToken.create({
      //   data: {
      //     email: input.email,
      //     token: verifyOtp,
      //     type: "email",
      //     expiresAt: moment(new Date()).add(1, "day").toDate(),
      //   },
      // });

      await createEvent({
        userId: user.id,
        category: "auth",
        type: "register",
        action: "created",
        status: "success",
        metadata: "admin:create-user",
        reqDetails: reqDetails,
      });

      return {
        success: true,
        data: {
          user: {
            id: user.id,
          },
        },
      };
    }),
  updateUser: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        role: z.string(),
        email: z.string().email(),
        emailVerified: z.boolean(),
        image: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          role: true,
          accounts: {
            select: {
              provider: true,
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "No user",
        };
      }

      const providers = user.accounts.map((account) => account.provider);

      if (!providers.includes("credentials") && user.email !== input.email) {
        return {
          success: false,
          msg: "This user is not using email/password authentication.",
        };
      }

      if (!providers.includes("credentials") && !input.emailVerified) {
        return {
          success: false,
          msg: "This user is not using email/password authentication.",
        };
      }

      if (
        currentUser.id !== user.id &&
        !ensureUserHasHigherRole(
          currentUser.role as UserRole,
          user.role as UserRole,
        )
      ) {
        return {
          success: false,
          msg: "You don't have permission to update this user's information.",
        };
      }

      if (input.email !== user.email) {
        const emailExists = await ctx.db.user.findFirst({
          where: {
            email: input.email,
          },
        });

        if (emailExists) {
          return {
            success: false,
            msg: "Email is already taken!",
          };
        }
      }

      await ctx.db.user.update({
        where: {
          id: user.id,
        },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          role: ctx.session.user.email === user.email ? undefined : input.role,
          email: input.email,
          emailVerified: !input.emailVerified ? null : new Date(),
          image: input.image !== "" ? input.image : undefined,
        },
      });

      const reqDetails = await getRequestDetails();
      await createEvent({
        userId: currentUser.id,
        category: "user",
        type: "updated",
        action: "created",
        status: "success",
        metadata: "admin:update-user",
        reqDetails: reqDetails,
      });

      return {
        success: true,
      };
    }),
  updateUserPassword: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        password: z.string().min(6),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "No user",
        };
      }

      if (
        currentUser.id !== user.id &&
        !ensureUserHasHigherRole(
          currentUser.role as UserRole,
          user.role as UserRole,
        )
      ) {
        return {
          success: false,
          msg: "You don't have permission to update this user's password.",
        };
      }

      const account = await ctx.db.account.findFirst({
        where: {
          userId: input.userId,
          provider: "credentials",
        },
        select: {
          id: true,
        },
      });
      if (!account) {
        return { success: false, msg: "No account!" };
      }

      const result = await caller.auth.hashPassword({
        password: input.password,
      });
      if (!result.success) {
        // await createEvent({
        //   userId: userId,
        //   organizationId: "admin",
        //   category: "modal",
        //   type: "user",
        //   action: "updated",
        //   status: "failed",
        //   error: "admin:hash-password-error",
        // });
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
          password: result.data,
        },
      });

      await ctx.db.userConfig.upsert({
        where: {
          userId: input.userId,
        },
        update: {
          requiresPasswordChange: false,
        },
        create: {
          userId: input.userId,
          requiresPasswordChange: false,
        },
      });

      if (currentUser.id !== user.id) {
        await ctx.db.session.deleteMany({
          where: {
            userId: input.userId,
          },
        });
      }

      // await createEvent({
      //   userId: userId,
      //   organizationId: "admin", //TODO
      //   category: "modal",
      //   type: "user",
      //   action: "updated",
      //   status: "success",
      //   metadata: `admin:password-updated`,
      // });

      return { success: true };
    }),
  resetPassword: protectedAdminProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      const user = await ctx.db.user.findFirst({
        where: {
          email: input.email,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          role: true,
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "No user",
        };
      }

      if (
        currentUser.id !== user.id &&
        !ensureUserHasHigherRole(
          currentUser.role as UserRole,
          user.role as UserRole,
        )
      ) {
        return {
          success: false,
          msg: "You don't have permission to update this user's password.",
        };
      }
      const reqDetails = await getRequestDetails();

      const account = await ctx.db.account.findFirst({
        where: {
          userId: user.id,
          type: "email",
          provider: "credentials",
        },
      });

      if (!account) {
        return {
          success: false,
        };
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
        userId: currentUser.id,
        category: "auth",
        type: "reset-password",
        action: "created",
        status: "success",
        metadata: `admin:reset-password:${user.email}`,
        reqDetails: reqDetails,
      });

      return {
        success: true,
      };
    }),
  sendVerifyEmail: protectedAdminProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      const user = await ctx.db.user.findFirst({
        where: {
          id: currentUser.id,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          role: true,
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "No user",
        };
      }

      if (
        currentUser.id !== user.id &&
        !ensureUserHasHigherRole(
          currentUser.role as UserRole,
          user.role as UserRole,
        )
      ) {
        return {
          success: false,
          msg: "You don't have permission to send verification email to this user.",
        };
      }

      const reqDetails = await getRequestDetails();

      const account = await ctx.db.account.findFirst({
        where: {
          user: {
            email: input.email,
          },
        },
        include: {
          user: true,
        },
      });

      if (!account) {
        return { success: false };
      }
      const otp = v4();
      // await ctx.db.verificationToken.deleteMany({
      //   where: {
      //     email: input.email,
      //     type: "email",
      //   },
      // });

      // await ctx.db.verificationToken.create({
      //   data: {
      //     email: input.email,
      //     token: otp,
      //     type: "email",
      //     expiresAt: moment(new Date()).add(1, "day").toDate(),
      //   },
      // });

      const appConfig = await getAppConfig();
      if (appConfig.isEmailEnabled) {
        await caller.authMail.sendVerify({
          email: account.user.email!,
          firstName: account.user.firstName,
          otp: otp,
        });
      }

      await createEvent({
        userId: currentUser.id,
        category: "auth",
        type: "verify",
        action: "created",
        status: "success",
        metadata: `admin:verify:${account.user.email}`,
        reqDetails: reqDetails,
      });
      return {
        success: true,
      };
    }),
  getAppConfig: protectedAdminProcedure.query(async ({ ctx }) => {
    const config = await getAppConfig();
    return config;
  }),
  getLoginAttemptConfigs: protectedAdminProcedure.query(async ({ ctx }) => {
    const config = await getAppConfig();
    return config.loginAttemptConfigs;
  }),
  getAllowedDomains: protectedAdminProcedure.query(async ({ ctx }) => {
    const domains = await ctx.db.allowedEmailDomain.findMany();
    return domains.map((d) => d.domain);
  }),
  createAllowedDomain: protectedAdminProcedure
    .input(
      z.object({
        domain: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingDomain = await ctx.db.allowedEmailDomain.findUnique({
        where: {
          domain: input.domain,
        },
      });

      if (existingDomain) {
        return {
          success: false,
          msg: "Domain already exists",
        };
      }
      const appConfig = await getAppConfig();

      await ctx.db.allowedEmailDomain.create({
        data: {
          appConfigId: appConfig.id,
          domain: input.domain,
        },
      });

      return {
        success: true,
      };
    }),
  deleteAllowedDomain: protectedAdminProcedure
    .input(
      z.object({
        domain: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingDomain = await ctx.db.allowedEmailDomain.findUnique({
        where: {
          domain: input.domain,
        },
      });

      if (!existingDomain) {
        return {
          success: false,
          msg: "Domain not found",
        };
      }

      await ctx.db.allowedEmailDomain.delete({
        where: {
          domain: input.domain,
        },
      });

      return {
        success: true,
      };
    }),
  updateLoginAttemptConfigs: protectedAdminProcedure
    .input(
      z
        .object({
          id: z.string(),
          attemptCount: z.number().min(1, "Attempts must be at least 1"),
          lockDuration: z.number(),
          isLockPermanent: z.boolean(),
        })
        .superRefine((data, ctx) => {
          if (!data.isLockPermanent && data.lockDuration < 1) {
            ctx.addIssue({
              path: ["lockDuration"],
              message: "Lock duration must be at least 1 minute",
              code: z.ZodIssueCode.custom,
            });
          }
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const configToUpdate = await ctx.db.loginAttemptConfig.findFirst({
        where: {
          id: input.id,
        },
      });

      if (!configToUpdate) {
        return {
          success: false,
          msg: "No config",
        };
      }

      await ctx.db.loginAttemptConfig.update({
        where: {
          id: input.id,
        },
        data: {
          attemptCount: input.attemptCount,
          lockDuration: input.lockDuration,
          isLockPermanent: input.isLockPermanent,
        },
      });

      return {
        success: true,
      };
    }),
  updateAppConfig: protectedAdminProcedure
    .input(
      z.object({
        isLoginEnabled: z.boolean(),
        isRegisterEnabled: z.boolean(),
        isForgotPasswordEnabled: z.boolean(),
        isLockAccountEnabled: z.boolean(),
        isEmailDomainRestirected: z.boolean(),
        isEmailEnabled: z.boolean(),
        isSuperadminHidden: z.boolean(),
        isSuperadminRoleCloaked: z.boolean(),
        canAdminCreateUsers: z.boolean(),
        canAdminGiveSameRole: z.boolean(),
        canAdminConfigureRedirects: z.boolean(),
        canAdminConfigureAppConfig: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const role = ctx.session.user.role;
      const appConfig = await getAppConfig();

      if (
        role === "admin" &&
        (!appConfig.canAdminConfigureAppConfig ||
          appConfig.canAdminConfigureAppConfig !==
            input.canAdminConfigureAppConfig)
      ) {
        return {
          success: false,
          msg: "You don't have permission to update app config",
        };
      }

      if (role === "admin") {
        if (input.isSuperadminHidden !== appConfig.isSuperadminHidden) {
          return {
            success: false,
            msg: "You don't have permission to update 'Hide Superadmin Users' setting",
          };
        }
        if (
          input.isSuperadminRoleCloaked !== appConfig.isSuperadminRoleCloaked
        ) {
          return {
            success: false,
            msg: "You don't have permission to update 'Cloak Superadmin User Role' setting",
          };
        }
        if (input.canAdminCreateUsers !== appConfig.canAdminCreateUsers) {
          return {
            success: false,
            msg: "You don't have permission to update 'Can Admin Create Users' setting",
          };
        }
        if (input.canAdminGiveSameRole !== appConfig.canAdminGiveSameRole) {
          return {
            success: false,
            msg: "You don't have permission to update 'Can Admin Give Same Role' setting",
          };
        }
        if (
          input.canAdminConfigureRedirects !==
          appConfig.canAdminConfigureRedirects
        ) {
          return {
            success: false,
            msg: "You don't have permission to update 'Can Admin Configure Redirects' setting",
          };
        }
      }

      await ctx.db.appConfig.update({
        where: {
          id: appConfig.id,
        },
        data: {
          isLoginEnabled: input.isLoginEnabled,
          isRegisterEnabled: input.isRegisterEnabled,
          isForgotPasswordEnabled: input.isForgotPasswordEnabled,
          isLockAccountEnabled: input.isLockAccountEnabled,
          isEmailDomainRestirected: input.isEmailDomainRestirected,
          isEmailEnabled: input.isEmailEnabled,
          isSuperadminHidden: input.isSuperadminHidden,
          isSuperadminRoleCloaked: input.isSuperadminRoleCloaked,
          canAdminConfigureRedirects: input.canAdminConfigureRedirects,
          canAdminConfigureAppConfig: input.canAdminConfigureAppConfig,
          canAdminCreateUsers: input.canAdminCreateUsers,
          canAdminGiveSameRole: input.canAdminGiveSameRole,
        },
      });

      return {
        success: true,
      };
    }),
  getBlockedIps: protectedAdminProcedure.query(async ({ ctx }) => {
    const ips = await ctx.db.blockedIp.findMany({
      orderBy: {
        ipAddress: "asc",
      },
    });
    return ips;
  }),
  blockIp: protectedAdminProcedure
    .input(
      z.object({
        ipAddress: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ip = await ctx.db.blockedIp.findUnique({
        where: {
          ipAddress: input.ipAddress,
        },
      });

      if (ip) {
        return {
          success: false,
          msg: "This IP address already blocked",
        };
      }

      const appConfig = await getAppConfig();

      await ctx.db.blockedIp.create({
        data: {
          appConfigId: appConfig.id,
          ipAddress: input.ipAddress,
        },
      });

      await ctx.db.session.deleteMany({
        where: {
          ip: input.ipAddress,
        },
      });

      return {
        success: true,
      };
    }),
  unblockIp: protectedAdminProcedure
    .input(
      z.object({
        ipAddress: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ip = await ctx.db.blockedIp.findUnique({
        where: {
          ipAddress: input.ipAddress,
        },
      });

      if (!ip) {
        return {
          success: false,
          msg: "This IP address is not blocked.",
        };
      }

      await ctx.db.blockedIp.delete({
        where: {
          ipAddress: input.ipAddress,
        },
      });

      return {
        success: true,
      };
    }),
  getRedirects: protectedAdminProcedure.query(async ({ ctx }) => {
    const redirects = await ctx.db.redirect.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return redirects;
  }),
  createRedirect: protectedAdminProcedure
    .input(
      z
        .object({
          origin: z
            .string()
            .default("/")
            .transform((value) =>
              value.startsWith("/") ? value : "/" + value,
            ),
          destination: z
            .string()
            .default("/")
            .transform((value) =>
              value.startsWith("/") ? value : "/" + value,
            ),
        })
        .refine((data) => data.origin !== data.destination, {
          message: "Origin and destination cannot be the same",
          path: ["destination"],
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const redirect = await ctx.db.redirect.findFirst({
        where: {
          origin: input.origin,
        },
      });

      if (redirect) {
        return {
          success: false,
          msg: "This origin already redirected",
        };
      }

      const appConfig = await getAppConfig();

      await ctx.db.redirect.create({
        data: {
          appConfigId: appConfig.id,
          origin: input.origin,
          destination: input.destination,
        },
      });

      return {
        success: true,
      };
    }),
  deleteRedirect: protectedAdminProcedure
    .input(
      z.object({
        redirectId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const redirect = await ctx.db.redirect.findFirst({
        where: {
          id: input.redirectId,
        },
      });

      if (!redirect) {
        return {
          success: false,
          msg: "This redirect not found",
        };
      }

      await ctx.db.redirect.delete({
        where: {
          id: input.redirectId,
        },
      });

      return {
        success: true,
      };
    }),
  createAuthProvider: protectedAdminProcedure
    .input(
      z.object({
        providers: z
          .array(
            z.enum([
              "google",
              "github",
              "discord",
              "slack",
              "guest",
              "credentials",
              "two-factor",
              "impersonate",
              "nodemailer",
            ]),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const appConfig = await getAppConfig();
      await ctx.db.authProvider.deleteMany({
        where: {
          appConfigId: appConfig.id,
        },
      });

      const providers = input.providers.map((provider) => ({
        appConfigId: appConfig.id,
        provider: provider,
      }));

      await ctx.db.authProvider.createMany({
        data: providers,
      });

      return {
        success: true,
        msg: "Providers updated successfully.",
      };
    }),
  createImpersonateToken: protectedAdminProcedure
    .input(
      z.object({
        impersonatedId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await ctx.db.impersonateToken.deleteMany({
        where: {
          impersonatingId: userId,
        },
      });

      const token = await ctx.db.impersonateToken.create({
        data: {
          impersonatingId: userId,
          impersonatedId: input.impersonatedId,
        },
      });

      return {
        success: true,
        data: token.id,
      };
    }),
  verifyPassword: protectedAdminProcedure
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

      const config = await ctx.db.userConfig.findFirst({
        where: {
          userId: userId,
        },
      });

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
  getSudoModeStatus: protectedAdminProcedure.query(async ({ ctx }) => {
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
    if (sudoModeExpiresAt.isBefore(moment())) {
      return false;
    }

    return true;
  }),
  disable2FA: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          role: true,
          twoFactorAuthentications: {
            where: {
              isEnabled: true,
            },
            select: {
              id: true,
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "No user",
        };
      }

      if (
        currentUser.id !== user.id &&
        !ensureUserHasHigherRole(
          currentUser.role as UserRole,
          user.role as UserRole,
        )
      ) {
        return {
          success: false,
          msg: "You don't have permission to unlock this user's account.",
        };
      }

      await ctx.db.twoFactorAuthentication.deleteMany({
        where: {
          userId: user.id,
        },
      });

      await ctx.db.twoFactorBackupCode.deleteMany({
        where: {
          userId: user.id,
        },
      });

      return {
        success: true,
      };
    }),
  requireTwoFactorAuth: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          email: true,
          role: true,
          _count: {
            select: {
              twoFactorAuthentications: {
                where: {
                  isEnabled: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "No user",
        };
      }

      if (currentUser.id === user.id) {
        return {
          success: false,
          msg: "You cannot require two factor authentication for yourself.",
        };
      }

      if (
        currentUser.id !== user.id &&
        !ensureUserHasHigherRole(
          currentUser.role as UserRole,
          user.role as UserRole,
        )
      ) {
        return {
          success: false,
          msg: "You don't have permission to require two factor authentication for this user.",
        };
      }

      if (user._count.twoFactorAuthentications > 0) {
        return {
          success: false,
          msg: "User already has two factor authentication enabled.",
        };
      }

      await ctx.db.userConfig.upsert({
        where: {
          userId: user.id,
        },
        update: {
          requiresTwoFactorAuth: true,
        },
        create: {
          userId: user.id,
          requiresTwoFactorAuth: true,
        },
      });

      return {
        success: true,
      };
    }),
  removeTwoFactorAuthRequirement: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          email: true,
          role: true,
          _count: {
            select: {
              twoFactorAuthentications: {
                where: {
                  isEnabled: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "No user",
        };
      }

      if (currentUser.id === user.id) {
        return {
          success: false,
          msg: "You cannot remove two factor authentication requirement for yourself.",
        };
      }

      if (
        currentUser.id !== user.id &&
        !ensureUserHasHigherRole(
          currentUser.role as UserRole,
          user.role as UserRole,
        )
      ) {
        return {
          success: false,
          msg: "You don't have permission to remove two factor authentication requirement for this user.",
        };
      }

      await ctx.db.userConfig.upsert({
        where: {
          userId: user.id,
        },
        update: {
          requiresTwoFactorAuth: false,
        },
        create: {
          userId: user.id,
          requiresTwoFactorAuth: false,
        },
      });

      return {
        success: true,
      };
    }),
  requirePasswordChange: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "No user",
        };
      }

      if (currentUser.id === user.id) {
        return {
          success: false,
          msg: "You cannot require password change for yourself.",
        };
      }

      if (
        currentUser.id !== user.id &&
        !ensureUserHasHigherRole(
          currentUser.role as UserRole,
          user.role as UserRole,
        )
      ) {
        return {
          success: false,
          msg: "You don't have permission to require password change for this user.",
        };
      }

      await ctx.db.userConfig.upsert({
        where: {
          userId: user.id,
        },
        update: {
          requiresPasswordChange: true,
        },
        create: {
          userId: user.id,
          requiresPasswordChange: true,
        },
      });

      return {
        success: true,
      };
    }),
  removePasswordChangeRequirement: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "No user",
        };
      }

      if (currentUser.id === user.id) {
        return {
          success: false,
          msg: "You cannot remove password change requirement for yourself.",
        };
      }

      if (
        currentUser.id !== user.id &&
        !ensureUserHasHigherRole(
          currentUser.role as UserRole,
          user.role as UserRole,
        )
      ) {
        return {
          success: false,
          msg: "You don't have permission to remove password change requirement for this user.",
        };
      }

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

      return {
        success: true,
      };
    }),
  deleteUserAccount: protectedAdminProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      const user = await ctx.db.user.findFirst({
        where: {
          accounts: {
            some: {
              id: input.accountId,
            },
          },
        },
        select: {
          id: true,
          email: true,
          role: true,
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
          msg: "No user",
        };
      }

      // if (currentUser.id === user.id) {
      //   return {
      //     success: false,
      //     msg: "You cannot delete your own account.",
      //   };
      // }

      if (
        currentUser.id !== user.id &&
        !ensureUserHasHigherRole(
          currentUser.role as UserRole,
          user.role as UserRole,
        )
      ) {
        return {
          success: false,
          msg: "You don't have permission to delete this user's account.",
        };
      }

      if (user.accounts.length === 1) {
        return {
          success: false,
          msg: "This user has only one account. Try deleting the user instead.",
        };
      }

      await ctx.db.account.delete({
        where: {
          id: input.accountId,
        },
      });

      return {
        success: true,
      };
    }),
  banUser: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string(),
        expiresAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          email: true,
          role: true,
          config: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "No user",
        };
      }

      if (currentUser.id === user.id) {
        return {
          success: false,
          msg: "You cannot ban yourself.",
        };
      }

      if (
        currentUser.id !== user.id &&
        !ensureUserHasHigherRole(
          currentUser.role as UserRole,
          user.role as UserRole,
        )
      ) {
        return {
          success: false,
          msg: "You don't have permission to ban this user.",
        };
      }

      await ctx.db.userConfig.upsert({
        where: {
          userId: user.id,
        },
        update: {
          bannedAt: new Date(),
          banReason: input.reason,
          banExpiresAt: input.expiresAt,
        },
        create: {
          userId: user.id,
          bannedAt: new Date(),
          banReason: input.reason,
          banExpiresAt: input.expiresAt,
        },
      });

      return {
        success: true,
      };
    }),
  unbanUser: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user;

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          email: true,
          role: true,
          config: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          msg: "No user",
        };
      }

      if (currentUser.id === user.id) {
        return {
          success: false,
          msg: "You cannot unban yourself.",
        };
      }

      if (
        currentUser.id !== user.id &&
        !ensureUserHasHigherRole(
          currentUser.role as UserRole,
          user.role as UserRole,
        )
      ) {
        return {
          success: false,
          msg: "You don't have permission to unban this user.",
        };
      }

      await ctx.db.userConfig.upsert({
        where: {
          userId: user.id,
        },
        update: {
          bannedAt: null,
          banReason: null,
          banExpiresAt: null,
        },
        create: {
          userId: user.id,
          bannedAt: null,
          banReason: null,
          banExpiresAt: null,
        },
      });

      return {
        success: true,
      };
    }),
} satisfies TRPCRouterRecord;
