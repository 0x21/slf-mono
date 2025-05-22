import { redirect } from "next/navigation";

import type { UserRole } from "@fulltemplate/auth/src/types";
import { ensureUserHasHigherRole } from "@fulltemplate/auth/src/client";
import { auth } from "@fulltemplate/auth/src/rsc";
import { BRAND_FAVICO, BRAND_TITLE } from "@fulltemplate/common";
import { db } from "@fulltemplate/db";

export const metadata = {
  title: `User Settings - ${BRAND_TITLE}`,
  description: `User Settings - ${BRAND_TITLE}`,
  icons: [{ rel: "icon", url: BRAND_FAVICO }],
};

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

  const currentUser = session.user;

  const isUnauthorized =
    currentUser.id !== params.userId &&
    !ensureUserHasHigherRole(
      currentUser.role as UserRole,
      user.role as UserRole,
    );

  if (isUnauthorized) {
    redirect(`/admin/users/${params.userId}`);
  }

  return <>{children}</>;
}
