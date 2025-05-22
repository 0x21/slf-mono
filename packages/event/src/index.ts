/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from "@fulltemplate/db";

import { env } from "./env";

interface CreateAuthEventParams {
  category: "auth";
  type:
    | "register"
    | "sign-in"
    | "two-factor"
    | "sign-out"
    | "reset-password"
    | "verify"
    | "update-information"
    | "change-password";
  action: "created";
  status: "success" | "failed";
}

interface CreateAdminEventParams {
  category: "admin";
  type: "navigate" | "reloadTab" | "closeTab";
  action: "created";
  status: "success" | "failed";
}
interface CreateUserEventParams {
  category: "user";
  type: "created" | "updated" | "deleted";
  action: "created";
  status: "success" | "failed";
}

interface CreateAccountEventParams {
  category: "account";
  type: "update-information";
  action: "created";
  status: "success" | "failed";
}

interface CreateEmailEventParams {
  category: "email";
  organizationId?: string;
  type: "welcome" | "verify" | "forgot-password" | "invite";
  action: "created";
  status: "success" | "failed";
}

type CreateEventParams = {
  userId?: string;
  organizationId?: string | undefined;
  severity?: string;
  metadata?: object | string;
  error?: string | undefined;
} & (
  | CreateAuthEventParams
  | CreateAdminEventParams
  | CreateUserEventParams
  | CreateAccountEventParams
  | CreateEmailEventParams
) & {
    // TODO
    reqDetails?:
      | {
          continent: string | undefined | null;
          country: string | undefined | null;
          city: string | undefined | null;
          region: string | undefined | null;
          regionCode: string | undefined | null;
          latitude: string | undefined | null;
          longitude: string | undefined | null;
          postalCode: string | undefined | null;
          ip: string | undefined | null;
          timezone: string | undefined | null;
          userAgent: object;
          environment: string | null;
        }
      | undefined;
  };

export const createEvent = async (params: CreateEventParams) => {
  if (env.DISABLE_EVENTS === "true") {
    return;
  }

  const sensitive =
    env.DISABLE_EVENTS_SENSITIVE_VARIABLES === "true"
      ? undefined
      : params.reqDetails;
  try {
    await db.event.create({
      data: {
        userId: params.userId,
        organizationId: params.organizationId,
        severity: params.severity,
        category: params.category,
        type: params.type,
        action: params.action,
        status: params.status,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        continent: sensitive?.continent,
        country: sensitive?.country,
        city: sensitive?.city,
        region: sensitive?.region,
        regionCode: sensitive?.regionCode,
        latitude: sensitive?.latitude,
        longitude: sensitive?.longitude,
        postalCode: sensitive?.postalCode,
        ip: sensitive?.ip,
        timezone: sensitive?.timezone,
        userAgent: params.reqDetails?.userAgent
          ? JSON.stringify(params.reqDetails.userAgent)
          : null,
        environment: params.reqDetails?.environment,
        error: params.error,
      },
    });
  } catch (error) {
    // empty
  }
};
