import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "@fulltemplate/db";

import { env } from "~/env";

export const createTRPCContext = (opts: CreateExpressContextOptions) => {
  const { req, res } = opts;

  return {
    req: req,
    res: res,
    db: db,
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

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

const enforceApiKeyIsAuthed = t.middleware(async ({ ctx, next }) => {
  const apiKeyHeader =
    ctx.req.headers["X-Api-Key"] ?? ctx.req.headers["x-api-key"];
  if (!apiKeyHeader || Array.isArray(apiKeyHeader)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }
  if (apiKeyHeader !== env.API_SECRET_BACKEND) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }
  return next();
});

export const protectedApiProcedure = t.procedure.use(enforceApiKeyIsAuthed);
