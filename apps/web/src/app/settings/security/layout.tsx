import { redirect } from "next/navigation";

import { auth } from "@fulltemplate/auth/src/rsc";
import { BRAND_FAVICO, BRAND_TITLE } from "@fulltemplate/common";

export const metadata = {
  title: `Security Settings - ${BRAND_TITLE}`,
  description: `Security Settings - ${BRAND_TITLE}`,
  icons: [{ rel: "icon", url: BRAND_FAVICO }],
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  return <>{children}</>;
}
