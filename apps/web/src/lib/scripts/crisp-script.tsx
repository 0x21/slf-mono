import Script from "next/script";

import { env } from "~/env";

const CrispScript = () => {
  if (!env.NEXT_PUBLIC_CRISP_WEBSITE_ID) {
    return null;
  }
  return (
    <Script id="chat-bot" type="text/javascript">
      {`window.$crisp=[];window.CRISP_WEBSITE_ID="${env.NEXT_PUBLIC_CRISP_WEBSITE_ID}";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`}
    </Script>
  );
};

export default CrispScript;
