import Link from "next/link";

import type { WithChildren } from "~/lib/types";
import Logo from "~/components/common/Logo";

const AuthLayout = ({ children }: WithChildren) => {
  return (
    <main className="flex flex-col md:h-screen md:flex-row-reverse">
      <section className="mx-auto flex w-full items-start px-4 md:w-1/3 md:items-center md:px-0">
        <div className="text-primary relative mx-auto my-auto w-full max-w-sm min-w-min md:-left-6 md:mx-0">
          <div className="bg-background flex py-6">
            <Link href="/">
              <Logo />
            </Link>
          </div>
        </div>
      </section>
      <section className="justify-center px-4 md:flex md:w-2/3 md:border-r md:px-0">
        <div className="mx-auto my-auto w-full max-w-sm min-w-min pt-4 pb-6 md:w-7/12 md:py-9">
          {children}
        </div>
      </section>
    </main>
  );
};

export default AuthLayout;
