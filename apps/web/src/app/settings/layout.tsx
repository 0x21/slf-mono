import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@fulltemplate/auth/src/rsc";
import { BRAND_FAVICO, BRAND_TITLE } from "@fulltemplate/common";

import SettingsSidebar from "~/components/shell/auth/SettingsSidebar";

export const metadata = {
  title: `Account Settings - ${BRAND_TITLE}`,
  description: `Account Settings - ${BRAND_TITLE}`,
  icons: [{ rel: "icon", url: BRAND_FAVICO }],
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname");

  const session = await auth();
  if (!session) {
    redirect(`/login?nextUrl=${encodeURIComponent(pathname ?? "")}`);
  }
  return (
    <>
      <SettingsSidebar>{children}</SettingsSidebar>
    </>
  );
}
