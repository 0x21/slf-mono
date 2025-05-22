import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

import { validateToken } from "@fulltemplate/auth/src/config";
import { auth } from "@fulltemplate/auth/src/rsc";
import { db } from "@fulltemplate/db";

const isomorphicGetSession = async (headers: Headers) => {
  const authToken = headers.get("Authorization") ?? null;
  if (authToken) {
    return validateToken(authToken);
  }
  return auth();
};

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const authToken = opts.headers.get("Authorization") ?? null;
  const session = await isomorphicGetSession(opts.headers);

  // const source = opts.headers.get("x-trpc-source") ?? "unknown";
  // console.log(">>> tRPC Request from", source, "by", session?.user);

  return {
    session: session,
    db: db,
    token: authToken,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserIsAuthedOrganization = t.middleware(
  async ({ ctx, getRawInput, next }) => {
    const session = ctx.session;
    if (!session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const input = await getRawInput();

    const result = await z
      .object({
        slug: z.string(),
      })
      .safeParseAsync(input);

    if (!result.success) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const organization = await ctx.db.organization.findFirst({
      where: {
        slug: result.data.slug,
      },
      select: {
        id: true,
        name: true,
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
          },
        },
      },
    });
    if (!organization) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const member = organization.members.find(
      (member) => member.userId === session.user.id,
    );

    // Not a organization member
    if (!member) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: {
        session: { ...session, user: session.user },
        organization: organization,
        organizationMember: member,
      },
    });
  },
);

export const protectedOrganizationProcedure = t.procedure.use(
  enforceUserIsAuthedOrganization,
);

const enforceUserIsAuthedOrganizationOwner = t.middleware(
  async ({ ctx, getRawInput, next }) => {
    const session = ctx.session;
    if (!session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const input = await getRawInput();

    const result = await z
      .object({
        slug: z.string(),
      })
      .safeParseAsync(input);

    if (!result.success) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const organization = await ctx.db.organization.findFirst({
      where: {
        slug: result.data.slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
          },
        },
      },
    });
    if (!organization) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const member = organization.members.find(
      (member) => member.userId === session.user.id,
    );

    // Not a organization member
    if (!member) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    if (member.role !== "owner") {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        session: { ...session, user: session.user },
        organization: organization,
        organizationMember: member,
      },
    });
  },
);

export const protectedOrganizationOwnerProcedure = t.procedure.use(
  enforceUserIsAuthedOrganizationOwner,
);

const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (
    ctx.session.user.role !== "admin" &&
    ctx.session.user.role !== "superadmin"
  ) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedAdminProcedure = t.procedure.use(enforceUserIsAdmin);

const enforceUserIsSuperAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.session.user.role !== "superadmin") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedSuperAdminProcedure = t.procedure.use(
  enforceUserIsSuperAdmin,
);

// const rateLimitMiddleware = (limit?: number, duration?: number) => {
//   return t.middleware(async ({ ctx, next, path }) => {
//     if (!ctx.session) {
//       throw new TRPCError({ code: "UNAUTHORIZED" });
//     }

//     const userId = ctx.session.user.id;
//     const key = `rate-limit:${userId}:${path}`;

//     const rateLimitResult = await isRateLimited(key, limit, duration);

//     if (rateLimitResult.success) {
//       return next({
//         ctx: {
//           session: { ...ctx.session, user: ctx.session.user },
//         },
//       });
//     } else {
//       throw new TRPCError({
//         code: "TOO_MANY_REQUESTS",
//         cause: {
//           tryAgainIn: rateLimitResult.tryAgainIn,
//         },
//       });
//     }
//   });
// };

// const timingMiddleware = t.middleware(async ({ next, path }) => {
//   const start = Date.now();

//   if (t._config.isDev) {
//     // artificial delay in dev 100-500ms
//     const waitMs = Math.floor(Math.random() * 400) + 100;
//     await new Promise((resolve) => setTimeout(resolve, waitMs));
//   }

//   const result = await next();

//   const end = Date.now();
//   console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

//   return result;
// });
