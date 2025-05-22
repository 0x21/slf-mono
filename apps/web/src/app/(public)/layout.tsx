import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { cacheGetAppConfig } from "~/lib/cache";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const heads = await headers();
  const pathname = heads.get("x-pathname");
  if (!pathname) {
    return <>{children}</>;
  }

  const appConfig = await cacheGetAppConfig();
  const pageRedirect = appConfig.redirects.find((r) => {
    let path = pathname;
    if (r.origin.endsWith("*") && !path.endsWith("/")) {
      path = `${path}/`;
    }
    const pattern = new RegExp(`^${r.origin.replace(/\*/g, "/?")}$`);
    return pattern.test(path);
  });
  if (pageRedirect) {
    redirect(pageRedirect.destination);
  }

  return <>{children}</>;
}
