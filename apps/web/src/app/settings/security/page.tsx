import { redirect } from "next/navigation";

import { auth } from "@fulltemplate/auth/src/rsc";

import { cacheGetUserAccountProviders } from "~/lib/cache";
import Client from "./client";

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const providers = await cacheGetUserAccountProviders(session.user.id);

  return <Client providers={providers} />;
}
