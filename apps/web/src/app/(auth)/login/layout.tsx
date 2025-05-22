import { redirect } from "next/navigation";

import { auth } from "@fulltemplate/auth/src/rsc";
import { BRAND_TITLE } from "@fulltemplate/common";

export const metadata = {
  title: `Sign In - ${BRAND_TITLE}`,
  description: `Sign In - ${BRAND_TITLE}`,
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
  return <>{children}</>;
}
