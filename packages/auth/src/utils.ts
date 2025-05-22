// import "server-only";

import { db } from "@fulltemplate/db";
import { getAppConfig } from "@fulltemplate/helpers/src/config";

export const rememberMaxAge = 60 * 60 * 24 * 30;
export const noRememberMaxAge = 60 * 60 * 24;

export const isProviderCredentials = (
  provider: string | undefined,
): boolean => {
  return (
    provider === "credentials" ||
    provider === "guest" ||
    provider === "impersonate" ||
    provider === "two-factor"
  );
};

export const checkRegisterEnabled = async (): Promise<boolean> => {
  const appConfig = await getAppConfig();
  return appConfig.isRegisterEnabled;
};

export const checkEmailDomainAllowed = async (
  email: string | null | undefined,
): Promise<boolean> => {
  if (!email) {
    return false;
  }
  const appConfig = await getAppConfig();
  const allowedEmailDomains = appConfig.allowedEmailDomains.map(
    (d) => d.domain,
  );
  if (allowedEmailDomains.length === 0) {
    return true;
  }
  const domain = email.split("@")[1];
  if (!domain) {
    return false;
  }
  return allowedEmailDomains.includes(domain);
};

export const checkIpAllowed = async (ip?: string | null): Promise<boolean> => {
  if (!ip) {
    return true;
  }
  const appConfig = await getAppConfig();
  if (appConfig.blockedIps.map((i) => i.ipAddress).includes(ip)) {
    await db.session.deleteMany({
      where: {
        ip: ip,
      },
    });
    return false;
  }
  return true;
};
