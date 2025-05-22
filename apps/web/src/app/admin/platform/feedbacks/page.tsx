/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { cookies } from "next/headers";

import { getCookiePageSize } from "~/lib/actions/actions";
import Client from "./client";

const VISIBLE_COLUMNS_KEY = "admin-feedback-display-properties";

export default async function Page() {
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
    <Client initialPageSize={pageSize} initialVisibleColumns={visibleColumns} />
  );
}
