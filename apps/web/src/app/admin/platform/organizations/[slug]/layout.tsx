import { redirect } from "next/navigation";

import { auth } from "@fulltemplate/auth";
import { db } from "@fulltemplate/db";

import { cacheGetAppConfig } from "~/lib/cache";
import LayoutUpper from "./layout-upper";

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { children } = props;
  const params = await props.params;

  const appConfig = await cacheGetAppConfig();
  const workspace = await db.organization.findFirst({
    where: {
      slug: params.slug,
      NOT:
        appConfig.isSuperadminHidden && session.user.role === "admin"
          ? {
              members: {
                some: {
                  role: "owner",
                  user: {
                    role: "superadmin",
                  },
                },
              },
            }
          : undefined,
    },
  });

  if (!workspace) {
    redirect("/admin/platform/workspaces");
  }

  return <LayoutUpper children={children} params={params} />;
}
