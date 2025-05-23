import { adminRouter } from "./routers/admin";
import { adminPlatformRouter } from "./routers/admin.platform";
import { authRouter } from "./routers/auth";
import { authApiRouter } from "./routers/auth.api";
import { authConnectionRouter } from "./routers/auth.connection";
import { authOrganizationRouter } from "./routers/auth.organization";
import { authUserRouter } from "./routers/auth.user";
import { publicRouter } from "./routers/public";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  public: publicRouter,
  auth: authRouter,
  authUser: authUserRouter,
  authApi: authApiRouter,
  authConnection: authConnectionRouter,
  admin: adminRouter,
  authOrganization: authOrganizationRouter,
  adminPlatform: adminPlatformRouter,
});

export type AppRouter = typeof appRouter;
