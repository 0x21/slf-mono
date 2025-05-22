import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { env as apiInternalEnv } from "@fulltemplate/api-internal/src/env";
import { env as dbEnv } from "@fulltemplate/db/src/env";

export const env = createEnv({
  extends: [dbEnv, apiInternalEnv],
  shared: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  server: {
    AUTH_URL: z.string().url(),
    AUTH_SECRET: z.string(),
    AUTH_GITHUB_ID: z.string().optional(),
    AUTH_GITHUB_SECRET: z.string().optional(),
    AUTH_GOOGLE_CLIENT_ID: z.string().optional(),
    AUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
    AUTH_SLACK_CLIENT_ID: z.string().optional(),
    AUTH_SLACK_CLIENT_SECRET: z.string().optional(),
    API_SECRET: z.string(),
  },
  experimental__runtimeEnv: process.env,
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    !!process.env.CI ||
    process.env.npm_lifecycle_event === "lint",
  emptyStringAsUndefined: true,
});
