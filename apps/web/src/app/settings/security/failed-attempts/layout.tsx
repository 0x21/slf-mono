import { BRAND_FAVICO, BRAND_TITLE } from "@fulltemplate/common";

export const metadata = {
  title: `Failed Login Attempts - ${BRAND_TITLE}`,
  description: `Failed Login Attempts - ${BRAND_TITLE}`,
  icons: [{ rel: "icon", url: BRAND_FAVICO }],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
