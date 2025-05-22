import type { NextAuthResult } from "next-auth";
import NextAuth from "next-auth";

import { getAdapter } from "./adapter";
import { getAuthOptions } from "./config";

const result = NextAuth((req) => {
  return getAuthOptions(req);
});

const auth: NextAuthResult["auth"] = result.auth;
const signIn: NextAuthResult["signIn"] = result.signIn;
const signOut: NextAuthResult["signOut"] = result.signOut;

export { auth, getAdapter, getAuthOptions, signIn, signOut };

export {
  invalidateSessionToken,
  isSecureContext,
  validateToken,
} from "./config";
