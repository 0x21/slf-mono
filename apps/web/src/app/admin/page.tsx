import { redirect } from "next/navigation";

import { auth } from "@fulltemplate/auth/src/rsc";

import { cacheGetAppConfig } from "~/lib/cache";
import Client from "./client";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const appConfig = await cacheGetAppConfig();

  return <Client appConfig={appConfig} userRole={session.user.role} />;
}
