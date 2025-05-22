import type { PropsWithChildren } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTimeZone } from "next-intl/server";

import { getUserLocale } from "~/lib/actions/actions";

export const LocaleProvider = async ({ children }: PropsWithChildren) => {
  const locale = await getUserLocale();
  const messages = await getMessages();
  const timezone = await getTimeZone();

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timezone}
    >
      {children}
    </NextIntlClientProvider>
  );
};
