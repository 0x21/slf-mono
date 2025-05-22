"use server";

import { cookies } from "next/headers";

// In this example the locale is read from a cookie. You could alternatively
// also read it from a database, backend service, or any other source.
const COOKIE_NAME = "NEXT_LOCALE";

export async function getUserLocale() {
  return (await cookies()).get(COOKIE_NAME)?.value ?? "en";
}

export async function setUserLocale(locale: string) {
  (await cookies()).set(COOKIE_NAME, locale);
}

export async function getActionKeyValue(key: string) {
  const cooks = await cookies();
  const value = cooks.get(key);
  return value;
}

export async function setActionKeyValue(key: string, value: string) {
  const cooks = await cookies();
  cooks.set(key, value);
}

export async function deleteCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("items-per-page"); //TODO
  // cookieStore.getAll().forEach((cookie) => {
  //   cookieStore.delete(cookie.name);
  // });
}

export async function getCookiePageSize() {
  const size = await getActionKeyValue("items-per-page");
  if (!size?.value) {
    return 10;
  }
  return parseInt(size.value);
}

export async function setCookiePageSize(pageSize: number) {
  await setActionKeyValue("items-per-page", pageSize.toString());
}

export async function setCookiePageSizeMobile(pageSize: number) {
  const size = await getActionKeyValue("items-per-page");
  if (!size?.value) {
    await setCookiePageSize(pageSize);
  }
}
