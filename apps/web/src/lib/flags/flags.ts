// import type { FlagOverridesType } from "@vercel/flags";
// import { cookies } from "next/headers";
// import { decrypt } from "@vercel/flags";

// export async function getFlags() {
//   const cooks = await cookies();
//   const overrideCookie = cooks.get("vercel-flag-overrides")?.value;
//   const overrides = overrideCookie
//     ? await decrypt<FlagOverridesType>(overrideCookie)
//     : {};

//   const flags = {
//     newTestPage: overrides?.newTestPage ?? false,
//   };

//   return flags;
// }
