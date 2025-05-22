import { cacheGetAppConfig } from "~/lib/cache";
import Client from "./client";

export default async function Page() {
  const appConfig = await cacheGetAppConfig();

  const allowedProviders: string[] = [];

  if (appConfig.isLoginEnabled) {
    const providers = appConfig.authProviders.map(
      (provider) => provider.provider,
    );
    allowedProviders.push(...providers);
  }

  return <Client allowedProviders={allowedProviders} />;
}
