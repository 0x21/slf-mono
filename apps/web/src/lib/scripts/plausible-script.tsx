import Script from "next/script";

import { env } from "~/env";

const PlausibleScript = () => {
  if (!env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) {
    return null;
  }
  return (
    <Script
      defer
      data-domain={env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
      src="https://plausible.io/js/script.js"
    ></Script>
  );
};

export default PlausibleScript;
