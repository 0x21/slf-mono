import { createEnv } from "@t3-oss/env-nextjs";
import { railway } from "@t3-oss/env-nextjs/presets-zod";
import { v4 } from "uuid";
import { z } from "zod";

import { env as apiInternalEnv } from "@fulltemplate/api-internal/src/env";
import { env as authEnv } from "@fulltemplate/auth/src/env";
import { env as dbEnv } from "@fulltemplate/db/src/env";
import { env as eventEnv } from "@fulltemplate/event/src/env";

// import { env as kafkaEnv } from "@fulltemplate/kafka/src/env";
// import { env as mailEnv } from "@fulltemplate/mail/src/env";

// keep imports relative for jiti
// import { env as encryptEnv } from "@fulltemplate/helpers/src/encrypt";
// import { env as recaptchaEnv } from "./lib/recaptcha";
// import { env as posthogEnv } from "./lib/posthog-env";

export const env = createEnv({
  extends: [
    dbEnv,
    authEnv,
    apiInternalEnv,
    // mailEnv,
    // kafkaEnv,
    eventEnv,
    // posthogEnv,
    // recaptchaEnv,
    railway(),
  ],
  shared: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  server: {
    API_SECRET: z.string().default(v4()),
    API_SECRET_BACKEND: z.string().default(v4()),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_SOCKET_URL: z.string().url(),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
    NEXT_PUBLIC_CRISP_WEBSITE_ID: z.string().optional(),
    // disable
    NEXT_PUBLIC_PLAUSIBLE_DISABLED: z.enum(["true", "false"]).default("false"),
    NEXT_PUBLIC_POSTHOG_DISABLED: z.enum(["true", "false"]).default("false"),
  },
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    NEXT_PUBLIC_CRISP_WEBSITE_ID: process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID,
    // disable
    NEXT_PUBLIC_POSTHOG_DISABLED: process.env.NEXT_PUBLIC_POSTHOG_DISABLED,
    NEXT_PUBLIC_PLAUSIBLE_DISABLED: process.env.NEXT_PUBLIC_PLAUSIBLE_DISABLED,
  },
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    !!process.env.CI ||
    process.env.npm_lifecycle_event === "lint",
  emptyStringAsUndefined: true,
});
