import { BRAND_FAVICO, BRAND_TITLE } from "@fulltemplate/common";

import { cacheGetAppConfig } from "~/lib/cache";
import Client from "./client";

export const metadata = {
  title: `User Profile - ${BRAND_TITLE}`,
  description: `User Profile - ${BRAND_TITLE}`,
  icons: [{ rel: "icon", url: BRAND_FAVICO }],
};

export default async function Page(props: {
  params: Promise<{ userId: string }>;
}) {
  const params = await props.params;
  const appConfig = await cacheGetAppConfig();
  return <Client params={params} appConfig={appConfig} />;
}
