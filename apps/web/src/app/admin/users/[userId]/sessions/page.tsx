/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { cookies } from "next/headers";

import type { UserRole } from "@fulltemplate/auth/src/types";
import { db } from "@fulltemplate/db";

import { getCookiePageSize } from "~/lib/actions/actions";
import Client from "./client";

const VISIBLE_COLUMNS_KEY = "admin-user-sessions-display-properties";

export default async function Page(props: {
  params: Promise<{ userId: string }>;
}) {
  const params = await props.params;
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

  const userRole = await db.user.findFirst({
    where: {
      id: params.userId,
    },
    select: {
      role: true,
    },
  });
  return (
    <Client
      params={{
        userId: params.userId,
        userRole: userRole?.role as UserRole | undefined,
      }}
      initialPageSize={pageSize}
      initialVisibleColumns={visibleColumns}
    />
  );
}
