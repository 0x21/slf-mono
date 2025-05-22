import { db } from "@fulltemplate/db";

// import "server-only";

export const getAppConfig = async () => {
  const appConfig = await db.appConfig.findFirst({
    include: {
      authProviders: true,
      redirects: true,
      allowedEmailDomains: true,
      blockedIps: true,
      loginAttemptConfigs: {
        orderBy: [{ isLockPermanent: "asc" }, { attemptCount: "asc" }],
      },
    },
  });

  if (appConfig) {
    return appConfig;
  }

  const defaultLoginAttemptConfigs = [
    { lockDuration: 15, attemptCount: 3 },
    { lockDuration: 30, attemptCount: 6 },
    { lockDuration: 0, attemptCount: 7, isLockPermanent: true },
  ];

  return await db.appConfig.create({
    data: {
      isLoginEnabled: true,
      isRegisterEnabled: true,
      authProviders: {
        createMany: {
          data: [
            { provider: "credentials" },
            { provider: "impersonate" },
            { provider: "two-factor" },
          ],
        },
      },
      loginAttemptConfigs: {
        createMany: {
          data: defaultLoginAttemptConfigs.map((cfg) => ({
            lockDuration: cfg.lockDuration,
            attemptCount: cfg.attemptCount,
            isLockPermanent: cfg.isLockPermanent ?? false,
          })),
        },
      },
    },
    include: {
      authProviders: true,
      redirects: true,
      allowedEmailDomains: true,
      blockedIps: true,
      loginAttemptConfigs: {
        orderBy: [{ isLockPermanent: "asc" }, { attemptCount: "asc" }],
      },
    },
  });
};

export const getUserConfig = async (userId: string) => {
  let userConfig = await db.userConfig.findFirst({
    where: {
      userId: userId,
    },
  });

  if (!userConfig) {
    userConfig = await db.userConfig.create({
      data: {
        userId: userId,
      },
    });
  }
  return userConfig;
};

export const getUserAccountProviders = async (userId: string) => {
  const user = await db.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      accounts: {
        select: {
          provider: true,
        },
      },
    },
  });

  if (!user?.accounts || user.accounts.length === 0) {
    return [];
  }

  return user.accounts.map((account) => account.provider);
};
