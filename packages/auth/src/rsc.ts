import type { NextAuthResult } from "next-auth";
import { cache } from "react";
import NextAuth from "next-auth";

import { getAuthOptions } from "./config";

const result = NextAuth((req) => {
  return getAuthOptions(req);
});

const auth: NextAuthResult["auth"] = cache(result.auth);

export { auth };
