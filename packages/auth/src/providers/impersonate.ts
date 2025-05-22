import CredentialsProvider from "@auth/core/providers/credentials";
import { z } from "zod";

import { db, Prisma } from "@fulltemplate/db";
import { createEvent } from "@fulltemplate/event";
import { GetRequestDetailsResult } from "@fulltemplate/helpers/src/request-details";

import type { UserRole } from "../types";
import { InvalidLoginError } from "../error";
import { rememberMaxAge } from "../utils";

const ImpersonateProvider = (reqDetails?: GetRequestDetailsResult) => {
  return CredentialsProvider({
    id: "impersonate",
    name: "Impersonate",
    credentials: {
      impersonateId: {
        type: "text",
      },
    },
    async authorize(credentials) {
      try {
        const loginSchema = z.object({
          impersonateId: z.string(),
        });
        const loginResult = await loginSchema.safeParseAsync(credentials);
        if (!loginResult.success) {
          await createEvent({
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: `validation-impersonation`,
            reqDetails: reqDetails,
          });
          return null;
        }
        const { impersonateId } = loginResult.data;

        const impersonateToken = await db.impersonateToken.findFirst({
          where: {
            id: impersonateId,
          },
          select: {
            impersonatingUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
            impersonatedUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
        });

        if (!impersonateToken) {
          await createEvent({
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: `invalid-impersonation-token:${impersonateId}`,
            reqDetails: reqDetails,
          });
          return null;
        }

        const impersonatingUser = impersonateToken.impersonatingUser;
        const impersonatedUser = impersonateToken.impersonatedUser;

        // Check impersonating user permissions
        if (
          impersonatingUser.role !== "superadmin" &&
          impersonatingUser.role !== "admin"
        ) {
          await createEvent({
            userId: impersonatingUser.id,
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: `impersonation-permission-error:${impersonatedUser.email}`,
            reqDetails: reqDetails,
          });
          return null;
        }

        // Prevent superadmin impersonation
        if (impersonatedUser.role === "superadmin") {
          await createEvent({
            userId: impersonatingUser.id,
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            metadata: `impersonate superadmin: ${impersonatedUser.email}`,
            reqDetails: reqDetails,
          });
          return null;
        }
        // Prevent superadmin impersonation
        if (
          impersonatingUser.role !== "superadmin" &&
          impersonatedUser.role === "admin"
        ) {
          await createEvent({
            userId: impersonatingUser.id,
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            metadata: `impersonate admin: ${impersonatedUser.email}`,
            reqDetails: reqDetails,
          });
          return null;
        }

        await createEvent({
          userId: impersonatingUser.id,
          category: "auth",
          type: "sign-in",
          action: "created",
          status: "success",
          metadata: `impersonate:${impersonatedUser.email}`,
          reqDetails: reqDetails,
        });

        return {
          ...impersonatedUser,
          maxAge: rememberMaxAge,
          role: impersonatedUser.role as UserRole,
          impersonatedById: impersonatingUser.id,
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

export default ImpersonateProvider;
