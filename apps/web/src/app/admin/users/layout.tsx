import { BRAND_FAVICO, BRAND_TITLE } from "@fulltemplate/common";

export const metadata = {
  title: `Users - ${BRAND_TITLE}`,
  description: `Users - ${BRAND_TITLE}`,
  icons: [{ rel: "icon", url: BRAND_FAVICO }],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
