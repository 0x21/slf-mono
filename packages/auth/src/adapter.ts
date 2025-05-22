/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";

import type { GetRequestDetailsResult } from "@fulltemplate/helpers/src/request-details";
import { db } from "@fulltemplate/db";

export const getAdapter = (reqDetails?: GetRequestDetailsResult): Adapter => {
  // @ts-ignore
  return {
    ...PrismaAdapter(db),
    createSession: async (session) => {
      const createdSession = await db.session.create({
        data: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
          continent: reqDetails?.continent,
          country: reqDetails?.country,
          city: reqDetails?.city,
          region: reqDetails?.region,
          regionCode: reqDetails?.regionCode,
          latitude: reqDetails?.latitude,
          longitude: reqDetails?.longitude,
          postalCode: reqDetails?.postalCode,
          ip: reqDetails?.ip,
          timezone: reqDetails?.timezone,
          userAgent: reqDetails?.userAgent
            ? JSON.stringify(reqDetails.userAgent)
            : null,
          environment: reqDetails?.environment,
        },
      });
      return createdSession;
    },
  };
};
