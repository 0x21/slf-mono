/// <reference types="./next-auth.d.ts" />

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { AuthConfig } from "@auth/core";
import type { Session } from "next-auth";
import type { NextRequest } from "next/server";
import { skipCSRFCheck } from "@auth/core";
import { encode } from "@auth/core/jwt";
import moment from "moment";
import { v4 } from "uuid";

import { db } from "@fulltemplate/db";
import { createEvent } from "@fulltemplate/event";
import { getAppConfig } from "@fulltemplate/helpers/src/config";
import { getRequestDetailsSync } from "@fulltemplate/helpers/src/request-details";

import type { UserRole, UserSession } from "./types";
import { getAdapter } from "./adapter";
import { env } from "./env";
import CredentialsProvider from "./providers/credentials";
import GithubProvider from "./providers/github";
import GoogleProvider from "./providers/google";
import ImpersonateProvider from "./providers/impersonate";
import TwoFactorProvider from "./providers/two-factor";
import {
  checkEmailDomainAllowed,
  checkIpAllowed,
  checkRegisterEnabled,
  isProviderCredentials,
  rememberMaxAge,
} from "./utils";

const getSessionStrategy = (): NonNullable<
  AuthConfig["session"]
>["strategy"] => {
  return "database";
};

const SESSION_STRATEGY = getSessionStrategy();

export const isSecureContext = env.NODE_ENV !== "development";

const hostname = new URL(env.AUTH_URL).hostname;

export const getAuthOptions = (req?: NextRequest) => {
  const reqDetails = getRequestDetailsSync(req?.headers);
  const adapter = getAdapter(reqDetails);

  const authOptions: AuthConfig = {
    callbacks: {
      signIn: async (params) => {
        // redirects to verify-request
        if (
          params.email?.verificationRequest &&
          params.account?.provider === "nodemailer"
        ) {
          return true;
        }
        const user = params.user as Session["user"] | null;
        if (!user) {
          await createEvent({
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: "no-user",
            reqDetails: reqDetails,
          });
          return false;
        }

        const res = await checkIpAllowed(reqDetails?.ip);
        if (!res) {
          console.log("checkIpAllowed");
          // throw new InvalidLoginError("bbanned-ip-address");
          return false;
        }
        const res1 = await checkRegisterEnabled();
        if (!res1) {
          console.log("checkRegisterEnabled");
          // throw new InvalidLoginError("register-disabled");
          return false;
        }
        const res2 = await checkEmailDomainAllowed(user.email);
        if (!res2) {
          console.log("checkEmailDomainAllowed");
          // throw new InvalidLoginError("not-allowed-email-domain");
          return false;
        }

        const config = await db.userConfig.findFirst({
          where: {
            userId: user.id,
          },
          select: {
            id: true,
            bannedAt: true,
            banReason: true,
            banExpiresAt: true,
          },
        });

        // if (config?.bannedAt && ) {
        //   await createEvent({
        //     userId: user.id,
        //     category: "auth",
        //     type: "sign-in",
        //     action: "created",
        //     status: "failed",
        //     error: "banned-user",
        //     reqDetails: reqDetails,
        //   });
        //   // throw new InvalidLoginError("account-banned");
        //   return false;
        // }

        if (config?.bannedAt && config.banExpiresAt === null) {
          console.log("HEYYYYYY");

          await createEvent({
            userId: user.id,
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: "account-permanently-banned",
            reqDetails: reqDetails,
          });
          return false;
        }

        if (config?.bannedAt && config.banExpiresAt !== null) {
          if (moment().isBefore(config.banExpiresAt)) {
            await createEvent({
              userId: user.id,
              category: "auth",
              type: "sign-in",
              action: "created",
              status: "failed",
              error: "account-temporarily-banned",
              reqDetails: reqDetails,
            });
            return false;
          }
          await db.userConfig.update({
            where: {
              id: config.id,
            },
            data: {
              bannedAt: null,
              banReason: null,
              banExpiresAt: null,
            },
          });
        }

        const provider = params.account?.provider;
        if (!provider) {
          await createEvent({
            userId: user.id,
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: "no-provider",
            reqDetails: reqDetails,
          });
          return false;
        }

        const appConfig = await getAppConfig();

        if (!appConfig.isLoginEnabled && user.role !== "superadmin") {
          await createEvent({
            userId: user.id,
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: "login-disabled",
            reqDetails: reqDetails,
          });
          return false;
        }

        const authProviders = appConfig.authProviders.map((p) => p.provider);
        if (!authProviders.includes(provider)) {
          await createEvent({
            userId: user.id,
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: `provider-not-allowed:${provider}`,
            reqDetails: reqDetails,
          });
          return false;
        }
        return true;
      },
      jwt: async (params) => {
        const user = params.user as Session["user"] | null;
        const token = params.token;
        const account = params.account;
        if (user) {
          token.id = user.id;
          token.username = user.username;
          token.firstName = user.firstName;
          token.lastName = user.lastName;
          token.name = user.name;
          token.email = user.email;
          token.image = user.image;
          token.role = user.role;

          if (
            (params.trigger === "signIn" || params.trigger === "signUp") &&
            SESSION_STRATEGY === "database" &&
            isProviderCredentials(account?.provider)
          ) {
            const now = Date.now();
            const expires = user.maxAge
              ? new Date(now + user.maxAge * 1000)
              : new Date(now + rememberMaxAge * 1000);

            const sessionToken = v4();

            const session = await adapter.createSession!({
              userId: user.id,
              sessionToken: sessionToken,
              expires: expires,
            });

            token.sessionId = session.sessionToken;
          }
        }
        return token;
      },
      // @ts-ignore
      session: (params) => {
        const session = params.session as Session;

        // Available when strategy: "jwt"
        // if ("token" in params) {
        //   const token = params.token;
        //   const now = Date.now();
        //   const expires = token.maxAge
        //     ? new Date(now + token.maxAge * 1000)
        //     : new Date(now + rememberMaxAge * 1000);
        //   session.expires = expires.toISOString();

        //   const userSession: UserSession = {
        //     id: session.id,
        //     sessionToken: session.sessionToken,
        //     expires: session.expires,
        //     user: {
        //       id: token.id,
        //       username: token.username,
        //       firstName: token.firstName,
        //       lastName: token.lastName,
        //       name: token.name,
        //       email: token.email,
        //       image: token.image,
        //       role: token.role,
        //     },
        //   };
        //   // if (token.impersonatedById) {
        //   //   userSession.impersonatedById = token.impersonatedById;
        //   // }
        //   return userSession;
        // }

        const userSession: UserSession = {
          id: session.id,
          sessionToken: session.sessionToken,
          expires: session.expires,
          user: {
            id: session.user.id,
            username: session.user.username,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            role: session.user.role,
          },
        };

        if (session.impersonatedById) {
          userSession.impersonatedById = session.impersonatedById;
        }

        return userSession;
      },
    },
    jwt:
      SESSION_STRATEGY === "database"
        ? {
            encode: (arg) => {
              return (
                (arg.token?.sessionId as string | undefined) ?? encode(arg)
              );
            },
          }
        : undefined,
    events: {
      signIn: async (message) => {
        const user = message.user as Session["user"];
        if (!user.id) {
          await createEvent({
            category: "auth",
            type: "sign-in",
            action: "created",
            status: "failed",
            error: "no-user",
            reqDetails: reqDetails,
          });
          return;
        }

        if (message.isNewUser) {
          await createEvent({
            userId: user.id,
            category: "auth",
            type: "register",
            action: "created",
            status: "success",
            reqDetails: reqDetails,
          });
          await db.user.update({
            where: {
              id: user.id,
            },
            data: {
              emailVerified: new Date(),
            },
          });
        }
        await createEvent({
          userId: user.id,
          category: "auth",
          type: "sign-in",
          action: "created",
          status: "success",
          reqDetails: reqDetails,
        });
        return;
      },
      signOut: async (message) => {
        if ("session" in message) {
          const session = message.session;
          if (!session) {
            return;
          }
          await db.session.deleteMany({
            where: {
              sessionToken: session.sessionToken,
            },
          });

          await createEvent({
            userId: session.userId,
            category: "auth",
            type: "sign-out",
            action: "created",
            status: "success",
            reqDetails: reqDetails,
          });
          return;
        }
        if ("token" in message) {
          const token = message.token;
          if (!token) {
            return;
          }
          if (!token.id) {
            return;
          }

          await createEvent({
            userId: token.id,
            category: "auth",
            type: "sign-out",
            action: "created",
            status: "success",
            reqDetails: reqDetails,
          });
          return;
        }
        return;
      },
    },
    cookies: {
      sessionToken: {
        name: isSecureContext
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          domain: `.${hostname}`,
          secure: isSecureContext,
        },
      },
    },
    adapter: adapter,
    // In development, we need to skip checks to allow Expo to work
    ...(!isSecureContext
      ? {
          skipCSRFCheck: skipCSRFCheck,
          trustHost: true,
        }
      : {}),
    secret: env.AUTH_SECRET,
    session: {
      strategy: SESSION_STRATEGY === "database" ? undefined : "jwt",
    },
    pages: {
      signIn: `/login`,
      newUser: "/dashboard",
      verifyRequest: `/verify-request`,
      signOut: "/login",
      error: "/login",
    },
    experimental: {
      enableWebAuthn: true,
    },
    providers: [
      CredentialsProvider(reqDetails),
      TwoFactorProvider(reqDetails),
      ImpersonateProvider(reqDetails),
      GoogleProvider(),
      GithubProvider(),
    ],
  };
  return authOptions;
};

export const validateToken = async (token: string): Promise<Session | null> => {
  const sessionToken = token.slice("Bearer ".length);
  const adapter = getAdapter();
  const session = await adapter.getSessionAndUser!(sessionToken);
  if (!session) {
    return null;
  }
  const user = session?.user as Session["user"];
  return {
    ...session.session,
    expires: session.session.expires.toISOString(),
    user: {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role as UserRole,
      maxAge: user.maxAge,
      impersonatedById: user.impersonatedById,
    },
    impersonatedById: user.impersonatedById,
  };
};

export const invalidateSessionToken = async (token: string) => {
  const sessionToken = token.slice("Bearer ".length);
  const adapter = getAdapter();
  await adapter.deleteSession!(sessionToken);
};
