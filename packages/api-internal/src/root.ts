import { authRouter } from "./routers/auth";
// import { authKafkaRouter } from "./routers/auth.kafka";
import { createCallerFactory, createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  // authKafka: authKafkaRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
