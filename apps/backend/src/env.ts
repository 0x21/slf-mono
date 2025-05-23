// don't import mailEnv as short, it breaks tsconfig jsx
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { env as dbEnv } from "@fulltemplate/db/src/env";
import { env as eventEnv } from "@fulltemplate/event/src/env";
// import { env as apiInternalEnv } from "@fulltemplate/api-internal/src/env";
// import { env as redisEnv } from "@fulltemplate/redis/src/env";
import { env as kafkaEnv } from "@fulltemplate/kafka/src/env";

// import { env as mailEnv } from "@fulltemplate/mail/src/env";

export const env = createEnv({
  extends: [
    dbEnv,
    // apiInternalEnv,
    // mailEnv,
    eventEnv,
    kafkaEnv,
    // redisEnv,
  ],
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.string(),
    SERVER_URL: z.string(),
    AUTH_URL: z.string().url(),
    API_SECRET: z.string(),
    API_SECRET_BACKEND: z.string(),
    DISABLE_CRON: z.enum(["true", "false"]).default("false"),
    DISABLE_KAFKA: z.enum(["true", "false"]).default("false"),
    DISABLE_OBFUSCATE: z.enum(["true", "false"]).default("false"),
  },
  // eslint-disable-next-line no-restricted-properties
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
