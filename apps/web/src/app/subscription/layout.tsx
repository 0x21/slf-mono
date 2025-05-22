import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@fulltemplate/auth/src/rsc";

export const metadata = {
  title: "Subscription",
  description: "Subscription",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
  return <>{children}</>;
}
