import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "@fulltemplate/db";

import { env } from "./env";

export const createTRPCContext = (opts: { headers: Headers }) => {
  return {
    db: db,
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

const enforceApiKeyIsAuthed = t.middleware(async ({ ctx, next }) => {
  const internalHeader = ctx.headers.get("x-api-key");
  if (!internalHeader || Array.isArray(internalHeader)) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (internalHeader !== env.API_SECRET) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: ctx,
  });
});

export const protectedProcedure = t.procedure.use(enforceApiKeyIsAuthed);
