import { redirect } from "next/navigation";

import type { UserRole } from "@fulltemplate/auth/src/types";
import { ensureUserHasHigherRole } from "@fulltemplate/auth/src/client";
import { auth } from "@fulltemplate/auth/src/rsc";
import { db } from "@fulltemplate/db";

import { cacheGetAppConfig } from "~/lib/cache";
import LayoutUpper from "./layout-upper";

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const { children } = props;
  const params = await props.params;

  const user = await db.user.findFirst({
    where: {
      id: params.userId,
    },
    select: {
      role: true,
    },
  });

  if (!user) {
    redirect("/admin/users");
  }

  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const appConfig = await cacheGetAppConfig();

  if (
    appConfig.isSuperadminHidden &&
    user.role === "superadmin" &&
    session.user.role !== "superadmin"
  ) {
    redirect("/admin/users");
  }

  const currentUser = session.user;

  const isUnauthorized =
    currentUser.id !== params.userId &&
    !ensureUserHasHigherRole(
      currentUser.role as UserRole,
      user.role as UserRole,
    );

  return (
    <LayoutUpper
      children={children}
      params={params}
      isUnauthorized={isUnauthorized}
    />
  );
}
