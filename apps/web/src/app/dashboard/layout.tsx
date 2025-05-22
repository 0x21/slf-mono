import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@fulltemplate/auth/src/rsc";

import { AuthSidebar } from "~/components/shell/auth/AuthSidebar";
import { SidebarProvider } from "~/components/ui/sidebar";

export const metadata = {
  title: "Dashboard",
  description: "Dashboard",
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
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";
  const defaultViewport = cookieStore.get("viewport:state")?.value;

  return (
    <>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AuthSidebar defaultViewport={defaultViewport}>{children}</AuthSidebar>
      </SidebarProvider>
    </>
  );
}
