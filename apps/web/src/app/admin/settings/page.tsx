import { redirect } from "next/navigation";

import { auth } from "@fulltemplate/auth/src/rsc";

import { cacheGetAppConfig } from "~/lib/cache";
import Client from "./client";

export default async function Page() {
  const appConfig = await cacheGetAppConfig();
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "admin" && !appConfig.canAdminConfigureAppConfig) {
    redirect("/admin");
  }

  return <Client role={session.user.role} />;
}
