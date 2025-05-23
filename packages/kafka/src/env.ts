import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    KAFKA_URL: z.string().default("kafka:9092"),
    PORTRANGEMIN: z.string().default("6000"),
    PORTRANGEMAX: z.string().default("7000"),
    SERVER_URL: z.string(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
