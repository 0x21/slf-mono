import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@fulltemplate/auth/src/rsc";
import { BRAND_FAVICO, BRAND_TITLE } from "@fulltemplate/common";

import { AuthSidebar } from "~/components/shell/auth/AuthSidebar";
import SettingsSidebar from "~/components/shell/auth/SettingsSidebar";
import { SidebarProvider } from "~/components/ui/sidebar";

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

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";
  const defaultViewport = cookieStore.get("viewport:state")?.value;
  return (
    <>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AuthSidebar defaultViewport={defaultViewport}>
          <SettingsSidebar>{children}</SettingsSidebar>
        </AuthSidebar>
      </SidebarProvider>
    </>
  );
}
