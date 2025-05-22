import "server-only";

import { headers } from "next/headers";

export const getSearchParams = async () => {
  const headersList = await headers();
  const search = headersList.get("x-search");
  const searchParams = new URLSearchParams(search ?? "");
  const params = Object.fromEntries(searchParams.entries());
  return params;
};
