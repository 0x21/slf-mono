import "@auth/core/jwt";
import "next-auth";

import type { DefaultSession } from "next-auth";

import type { UserRole } from "./types";

declare module "next-auth" {
  interface Session extends DefaultSession {
    id: string;
    sessionToken: string;
    userId: string;
    expires: string;
    continent?: string | null;
    country?: string | null;
    city?: string | null;
    region?: string | null;
    regionCode?: string | null;
    latitude?: string | null;
    longitude?: string | null;
    postalCode?: string | null;
    ip?: string | null;
    timezone?: string | null;
    userAgent?: string | null;
    environment: string | null;
    impersonatedById?: string | null;
    user: DefaultSession["user"] & {
      id: string;
      firstName: string | undefined | null;
      lastName: string | undefined | null;
      name: string | undefined | null;
      username: string | undefined | null;
      email: string | undefined | null;
      image: string | undefined | null;
      role: UserRole;
      impersonatedById?: string | null;
      maxAge?: number;
    };
  }

  interface User {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    username?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: UserRole;
  }

  interface AdapterAccount {
    providerAccountId: string | null;
  }

  interface AdapterSession {
    id: string;
    sessionToken: string;
    userId: string;
    expires: string;
    continent?: string | null;
    country?: string | null;
    city?: string | null;
    region?: string | null;
    regionCode?: string | null;
    latitude?: string | null;
    longitude?: string | null;
    postalCode?: string | null;
    ip?: string | null;
    timezone?: string | null;
    userAgent?: string | null;
    environment: string | null;
    impersonatedById?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    username?: string | undefined | null;
    firstName?: string | undefined | null;
    lastName?: string | undefined | null;
    name?: string | undefined | null;
    email?: string | undefined | null;
    image?: string | undefined | null;
    role: UserRole;
  }
}
