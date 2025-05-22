import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { env as dbEnv } from "@fulltemplate/db/src/env";

export const env = createEnv({
  extends: [dbEnv],
  server: {
    DISABLE_EVENTS: z.enum(["true", "false"]).default("false"),
    DISABLE_EVENTS_SENSITIVE_VARIABLES: z
      .enum(["true", "false"])
      .default("false"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
