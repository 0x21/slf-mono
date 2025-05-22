import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { env as dbEnv } from "@fulltemplate/db/src/env";

// import { env as kafkaEnv } from "@fulltemplate/kafka/src/env";
// import { env as mailEnv } from "@fulltemplate/mail/src/env";

export const env = createEnv({
  extends: [
    dbEnv,
    // kafkaEnv,
    // mailEnv,
  ],
  server: {
    API_SECRET: z.string(),
    AUTH_URL: z.string(),
  },
  experimental__runtimeEnv: process.env,
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    !!process.env.CI ||
    process.env.npm_lifecycle_event === "lint",
  emptyStringAsUndefined: true,
});
