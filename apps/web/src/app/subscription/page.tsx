import { redirect } from "next/navigation";

import { auth } from "@fulltemplate/auth";

import Client from "./client";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <Client />;
}
