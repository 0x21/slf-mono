import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "@fulltemplate/auth/src/rsc";
import { BRAND_FAVICO, BRAND_TITLE } from "@fulltemplate/common";

import { AdminSidebar } from "~/components/shell/admin/AdminSidebar";
import ImpersonateBanner from "~/components/shell/admin/ImpersonateBanner";
import { SidebarProvider } from "~/components/ui/sidebar";
import { cacheGetAppConfig } from "~/lib/cache";

export const metadata = {
  title: `Admin Dashboard - ${BRAND_TITLE}`,
  description: `Admin Dashboard ${BRAND_TITLE}`,
  icons: [{ rel: "icon", url: BRAND_FAVICO }],
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    notFound();
  }
  if (session.user.role !== "admin" && session.user.role !== "superadmin") {
    notFound();
  }
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";
  const defaultViewport = cookieStore.get("viewport:state")?.value;

  const appConfig = await cacheGetAppConfig();

  const isSettingsEnabled =
    appConfig.canAdminConfigureAppConfig || session.user.role === "superadmin";

  return (
    <>
      <ImpersonateBanner />
      <SidebarProvider defaultOpen={defaultOpen}>
        <AdminSidebar
          isSettingsEnabled={isSettingsEnabled}
          defaultViewport={defaultViewport}
        >
          {children}
        </AdminSidebar>
      </SidebarProvider>
    </>
  );
}
