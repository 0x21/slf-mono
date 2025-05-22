import { redirect } from "next/navigation";

import { auth } from "@fulltemplate/auth/src/rsc";
import { BRAND_TITLE } from "@fulltemplate/common";

import { cacheGetAppConfig } from "~/lib/cache";

export const metadata = {
  title: `Forgot Password - ${BRAND_TITLE}`,
  description: `Forgot Password - ${BRAND_TITLE}`,
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }
  const appConfig = await cacheGetAppConfig();

  if (!appConfig.isForgotPasswordEnabled) {
    redirect("/login");
  }

  return <>{children}</>;
}
