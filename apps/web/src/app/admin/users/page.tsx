/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@fulltemplate/auth/src/rsc";

import { getCookiePageSize } from "~/lib/actions/actions";
import { cacheGetAppConfig } from "~/lib/cache";
import Client from "./client";

const VISIBLE_COLUMNS_KEY = "admin-users-display-properties";

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const appConfig = await cacheGetAppConfig();
  const cooks = await cookies();
  const pageSize = await getCookiePageSize();
  const visibleColumnsCookie = cooks.get(VISIBLE_COLUMNS_KEY);
  let visibleColumns;
  if (visibleColumnsCookie) {
    try {
      visibleColumns = JSON.parse(visibleColumnsCookie.value);
    } catch (error) {
      visibleColumns = {};
    }
  } else {
    visibleColumns = {};
  }

  return (
    <Client
      initialPageSize={pageSize}
      initialVisibleColumns={visibleColumns}
      appConfig={appConfig}
      userRole={session.user.role}
      userId={session.user.id}
    />
  );
}
