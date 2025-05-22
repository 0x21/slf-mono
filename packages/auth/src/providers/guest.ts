import CredentialsProvider from "@auth/core/providers/credentials";
import { v4 } from "uuid";

import { db, Prisma } from "@fulltemplate/db";
import { createEvent } from "@fulltemplate/event";
import { GetRequestDetailsResult } from "@fulltemplate/helpers/src/request-details";

import type { UserRole } from "../types";
import { getAdapter } from "../adapter";
import { env } from "../env";
import { InvalidLoginError } from "../error";
import { rememberMaxAge } from "../utils";

const GuestProvider = (reqDetails?: GetRequestDetailsResult) => {
  return CredentialsProvider({
    id: "guest",
    name: "Guest",
    async authorize() {
      const adapter = getAdapter(reqDetails);
      try {
        // TODO use URL
        const host = env.AUTH_URL.toLowerCase();
        const domain = env.AUTH_URL.includes("localhost")
          ? "example.com"
          : host.replace(/^http?:\/\//, "").replace(/^https?:\/\//, "");
        const uuid = v4();
        const email = `guest-${uuid.slice(0, 8)}@${domain}`;

        const user = await db.user.create({
          data: {
            email: email,
            firstName: `Guest`,
            lastName: `${uuid.slice(0, 8)}`,
            name: `Guest ${uuid.slice(0, 8)}`,
            emailVerified: new Date(),
            role: "user",
            isAnonymous: true,
          },
        });

        await db.userConfig.create({
          data: {
            userId: user.id,
          },
        });

        await adapter.linkAccount!({
          providerAccountId: null,
          userId: user.id,
          type: "email",
          provider: "credentials",
        });

        await createEvent({
          userId: user.id,
          category: "auth",
          type: "register",
          action: "created",
          status: "success",
          metadata: "guest",
          reqDetails: reqDetails,
        });

        const maxAge = rememberMaxAge;
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
