/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { getRequestConfig } from "next-intl/server";

import { availableLocaleCodes } from "~/i18n/locales";
import { getUserLocale } from "~/lib/actions/actions";

// Loads the Application Locales/Translations Dynamically
const loadLocaleDictionary = async (locale: string) => {
  if (locale === "en") {
    // This enables HMR on the English Locale, so that instant refresh
    // happens while we add/change texts on the source locale
    return import("./locales/en.json").then((f) => f.default);
  }

  if (availableLocaleCodes.includes(locale)) {
    // Other languages don't really require HMR as they will never be development languages
    // so we can load them dynamically
    return import(`./locales/${locale}.json`).then((f) => f.default);
  }

  throw new Error(`Unsupported locale: ${locale}`);
};

// Provides `next-intl` configuration for RSC/SSR
export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const locale = await getUserLocale();

  return {
    locale: locale,
    messages: await loadLocaleDictionary(locale),
    timeZone: "Etc/UTC",
  };
});
